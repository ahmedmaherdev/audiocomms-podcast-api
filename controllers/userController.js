const AppError = require('../utils/appError')
const User = require('../models/userModel')
const Follow = require('../models/followModel')
const APIFeatures = require('../utils/apiFeatures')
const catchAsync = require('../utils/catchAsync')
const factory = require('./handlerFactory')
const { uploader } = require('../utils/cloudinary')
const { StatusCodes } = require('http-status-codes')

const { Readable } = require('stream')
const sharp = require('sharp')

const filterObj = (obj, ...allowedFeilds) => {
    const newObj = {}
    Object.keys(obj).forEach((el) => {
        if (allowedFeilds.includes(el)) {
            newObj[el] = obj[el]
        }
    })
    return newObj
}

exports.getMe = (req, res, next) => {
    req.params.id = req.user.id
    next()
}

exports.getUser = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.params.id).lean()

    if (!user) {
        return next(
            new AppError('There is no user with that ID', StatusCodes.NOT_FOUND)
        )
    }

    const followedByMe = await Follow.findOne({
        follower: req.user.id,
        following: req.params.id,
    }).lean()

    user.isFollowed = followedByMe ? true : false

    res.status(StatusCodes.OK).json({
        status: 'success',
        data: user,
    })
})

exports.getAllUsers = catchAsync(async (req, res, next) => {
    const featuresBeforePagination = new APIFeatures(
        User.find(),
        req.query
    ).filter()

    const features = new APIFeatures(User.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate()

    // const docs = await features.query.explain()
    let users = await features.query
        .select('-role -passwordResetToken -passwordResetExpires')
        .lean()

    const usersIds = []

    users.forEach((user) => usersIds.push(user._id))

    let usersFollowedByMe = await Follow.find(
        {
            follower: req.user.id,
            following: { $in: usersIds },
        },
        { following: 1, _id: 0 }
    ).lean()

    users.forEach((user) => {
        user.isFollowed = usersFollowedByMe.some(
            (userFollowed) =>
                userFollowed.following.toString() === user._id.toString()
        )
    })

    const docsCount = await User.countDocuments(featuresBeforePagination.query)

    res.status(StatusCodes.OK).json({
        status: 'success',
        results: users.length,
        docsCount,
        data: {
            data: users,
        },
    })
})

exports.updateMe = catchAsync(async (req, res, next) => {
    // 1) Create error if user POSTs password data
    if (req.body.password || req.body.passwordConfirm) {
        return next(
            new AppError(
                'This route is not for password updates. Please use /updateMyPassword',
                400
            )
        )
    }

    if (req.file) {
        const bufferToStream = (buffer) => {
            const readable = new Readable({
                read() {
                    this.push(buffer)
                    this.push(null)
                },
            })
            return readable
        }

        const data = await sharp(req.file.buffer)
            .webp({ quality: 20 })
            .toBuffer()
        const stream = uploader.upload_stream(
            { folder: 'userPhotos' },
            (error, result) => {
                if (error)
                    return next(
                        new AppError(error.message, StatusCodes.BAD_REQUEST)
                    )
                req.body.photo = result.secure_url
            }
        )
        bufferToStream(data).pipe(stream)
    }

    // filtered out unwanted feild names

    const filteredBody = filterObj(
        req.body,
        'name',
        'email',
        'language',
        'country',
        'userType',
        'photo'
    )

    //Update user document
    const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        filteredBody,
        {
            new: true,
            runValidators: true,
        }
    )

    // send the response
    res.status(200).json({
        status: 'success',
        user: updatedUser,
    })
})

exports.deleteMe = catchAsync(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user.id, {
        active: false,
    })

    res.status(204).json({
        status: 'success',
        data: null,
    })
})

exports.getAllFullUsers = factory.getAll(User, true)

exports.getFullUser = factory.getOne(User, true)

// Don't update passwords with this
exports.updateUser = factory.updateOne(User)

exports.deleteUser = factory.deleteOne(User)
