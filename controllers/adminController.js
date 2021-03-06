const fs = require('fs')
const imgur = require('imgur-node-api')
const IMGUR_CLIENT_ID = process.env.IMGUR_CLIENT_ID

const db = require('../models')
const Category = db.Category
const Restaurant = db.Restaurant
const User = db.User

const adminService = require('../services/adminService')

const adminController = {
  getRestaurants: (req, res) => {
    adminService.getRestaurants(req, res, (data) => {
      return res.render('admin/restaurants', data)
    })
  },

  createRestaurant: (req, res) => {
    Category.findAll({ raw: true, nest: true })
      .then(categories => {
        return res.render('admin/create', { categories })
      })
      .catch(err => console.log(err))
  },

  postRestaurant: (req, res) => {
    adminService.postRestaurant(req, res, (data) => {
      req.flash('success_msg', data.message)
      return res.redirect('/admin/restaurants')
    })
  },

  getRestaurant: (req, res) => {
    Restaurant.findByPk(req.params.id, { include: [Category], raw: true, nest: true })
      .then(restaurant => {
        return res.render('admin/restaurant', { restaurant })
      })
      .catch(err => console.log(err))
  },

  editRestaurant: async (req, res) => {
    const categories = await Category.findAll({ raw: true, nest: true })
    Restaurant.findByPk(req.params.id, { raw: true })
      .then(restaurant => {
        return res.render('admin/create', { restaurant, categories })
      })
      .catch(err => console.log(err))
  },

  putRestaurant: async (req, res) => {
    const { name, tel, addr, open_hours, desc, categoryId } = req.body
    const { file } = req

    // Try to reduce callback & duplicated code
    if (file) {
      imgur.setClientID(IMGUR_CLIENT_ID)
      imgur.upload(file.path, (err, img) => {
        Restaurant.findByPk(req.params.id)
          .then(restaurant => {
            return restaurant.update({
              name,
              tel,
              addr,
              open_hours,
              desc,
              image: file ? img.data.link : restaurant.image,
              CategoryId: categoryId
            })
          })
          .then(restaurant => {
            req.flash('success_msg', `${restaurant.name} updated!`)
            return res.redirect(`/admin/restaurants/${req.params.id}`)
          })
          .catch(err => console.log(err))
      })
    } else {
      Restaurant.findByPk(req.params.id)
        .then(restaurant => {
          return restaurant.update({
            name,
            tel,
            addr,
            open_hours,
            desc,
            image: file ? img.data.link : restaurant.image,
            CategoryId: categoryId
          })
        })
        .then(restaurant => {
          req.flash('success_msg', `${restaurant.name} updated!`)
          return res.redirect(`/admin/restaurants/${req.params.id}`)
        })
        .catch(err => console.log(err))
    }
  },

  deleteRestaurant: (req, res) => {
    adminService.deleteRestaurant(req, res, (data) => {
      if (data.status === 'success') {
        return res.redirect('/admin/restaurants')
      }
    })
  },

  getUsers: (req, res) => {
    User.findAll({ raw: true })
      .then(users => {
        return res.render('admin/users', { users, currUser: req.user.id })
      })
      .catch(err => console.log(err))
  },

  putUser: (req, res) => {
    User.findByPk(req.params.id)
      .then(user => {
        return user.update({
          isAdmin: !user.isAdmin
        })
      })
      .then(user => {
        req.flash('success_msg', `${user.name}'s role updated!`)
        return res.redirect(`/admin/users`)
      })
      .catch(err => console.log(err))
  }
}

module.exports = adminController