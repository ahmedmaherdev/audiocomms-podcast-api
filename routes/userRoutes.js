const express = require('express')
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
} = require('../controllers/userController')

const { followUser } = require('../controllers/followController')
const router = express.Router()

router.post('/signup', signup)
router.post('/login', login)
router.post('/forgotPassword', forgotPassword)
router.patch('/resetPassword/:token', resetPassword)

// Protect all the routes after this
router.use(protect)

router.patch('/updateMyPassword', updatePassword)

router.get('/', getAllUsers)
router.get('/me', getMe, getFullUser)
router.get('/:id', getUser)
router.post('/:userId/following', followUser)
router.delete('/deleteMe', deleteMe)
router.patch('/updateMe', multerUploads, updateMe)

// Restrict all the routes to admin after this
router.use(restrictTo('admin'))

router.route('/admin/').get(getAllFullUsers)
router.route('/admin/:id').get(getFullUser).patch(updateUser).delete(deleteUser)

module.exports = router
