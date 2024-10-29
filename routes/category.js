var express = require("express");
var router = express.Router();


var CategoryModel = require('../models/category');
var Product = require('../models/product');

router.get('/:slug', async (req,res)=>{
    try
    {
        const {categorySlug} = req.params;
        console.log(categorySlug)
        const category = await CategoryModel.findOne({slug: categorySlug})

        if(!category) {
            return res.status(404).send('Category not found')
        }
        const products = await Product.findOne({categoryId: category.id})

        res.render('category/categoryPage',{
            products: products,
            category: category
        })
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
})

module.exports = router;