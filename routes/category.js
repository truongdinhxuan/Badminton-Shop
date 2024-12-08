var express = require("express");
var router = express.Router();


var CategoryModel = require('../models/category');
var ProductModel = require('../models/product');

router.get('/:slug', async (req,res)=>{
    try
    {
        const {slug} = req.params;
        const category = await CategoryModel.find().lean();
        const selectedCategory = await CategoryModel.findOne({slug: slug})

        if(!selectedCategory) {
            return res.status(404).send('Category not found')
        }
        const products = await ProductModel.find({categoryId: selectedCategory.id})
        console.log(products)
        res.render('category/categoryPage',{
            products: products,
            category: category,
            selectedCategory: selectedCategory
        })
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
})

module.exports = router;