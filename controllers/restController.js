const db = require('../models')
const Restaurant = db.Restaurant
const Category = db.Category
const Comment = db.Comment
const User = db.User

const pageLimit = 9

const restController = {
  getRestaurants: async (req, res) => {
    const page = Number(req.query.page) || 1
    let offset = 0
    let categoryId = ''
    let whereQuery = {}
    if (req.query.page) {
      offset = (req.query.page - 1) * pageLimit
    }
    if (req.query.categoryId) {
      categoryId = Number(req.query.categoryId)
      whereQuery.CategoryId = categoryId
    }

    const restaurants = await Restaurant.findAndCountAll({
      include: [Category],
      where: whereQuery,
      offset, limit: pageLimit,
      raw: true, nest: true
    })

    const pageCount = Math.ceil(restaurants.count / pageLimit)
    const pageIndices = Array.from({ length: pageCount }).map((_, i) => i + 1)
    const prev = page - 1 < 1 ? 1 : page - 1
    const next = page + 1 > pageCount ? pageCount : page + 1

    const restData = restaurants.rows.map(r => ({
      ...r,
      desc: r.desc.substring(0, 50)
    }))
    const categories = await Category.findAll({
      // include: [Restaurant],
      raw: true, nest: true
    })
    return res.render('restaurants', {
      restaurants: restData,
      categories,
      categoryId,
      page, pageIndices, prev, next
    })
  },

  getRestaurant: async (req, res) => {
    const restaurant = await Restaurant.findByPk(req.params.id, {
      include: [
        Category,
        { model: Comment, include: User }
      ]
      // using 'nest: true, raw: true' here have some problem,
      // So, use toJSON() later instead
    })
    return res.render('restaurant', { restaurant: restaurant.toJSON() })
  },

  getFeeds: async (req, res) => {
    const restaurants = await Restaurant.findAll({
      order: [['createdAt', 'DESC']],
      include: [Category],
      limit: 10,
      nest: true, raw: true
    })
    const comments = await Comment.findAll({
      order: [['createdAt', 'DESC']],
      include: [User, Restaurant],
      limit: 10,
      nest: true, raw: true
    })
    return res.render('feeds', { restaurants, comments })
  }

}

module.exports = restController