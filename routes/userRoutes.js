const express = require('express')
const os = require('os')
const { multerUploads } = require('../utils/multer')
const {
    login,
    signup,
    protect,
    restrictTo,
    updatePassword,
    forgotPassword,
    resetPassword,
} = require('../controllers/authController')

const {
    deleteMe,
    deleteUser,
    getAllFullUsers,
    getAllUsers,
    getMe,
    getUser,
    getFullUser,
    updateUser,
    updateMe,
    getUnfollowedUsers,
    searchUser,
} = require('../controllers/userController')

const {
    followUser,
    getUserFollowing,
    unFollowUser,
    getUserFollowers,
} = require('../controllers/followController')

const router = express.Router()

router.post('/signup', signup)
router.post('/login', login)
router.post('/forgotPassword', forgotPassword)
router.patch('/resetPassword/:token', resetPassword)

const uploadImageMiddleware = (req,res,next) => {
    setInterval(() => {
    console.log('memory avaliable: ' , os.freemem())
    }, 1000);
    console.log('uploading now');
    next()
}

router.patch('/updateMe', uploadImageMiddleware , multerUploads, protect, updateMe)

// Protect all the routes after this
router.use(protect)
router.get('/search', searchUser)
router.get('/admin/', restrictTo('admin'), getAllFullUsers)

router.patch('/updateMyPassword', updatePassword)

router.get('/', getAllUsers)
router.get('/discover', getUnfollowedUsers)
router.get('/me', getMe, getFullUser)
router.get('/:id', getUser)

router.get('/me/following', getMe, getUserFollowing)
router.get('/me/followers', getMe, getUserFollowers)
router
    .route('/:id/following')
    .get(getUserFollowing)
    .post(followUser)
    .delete(unFollowUser)
router.get('/:id/followers', getUserFollowers)

router.delete('/deleteMe', deleteMe)

// Restrict all the routes to admin after this
router.use(restrictTo('admin'))

router.route('/admin/:id').get(getFullUser).patch(updateUser).delete(deleteUser)

module.exports = router
