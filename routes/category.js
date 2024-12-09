var express = require("express");
var router = express.Router();


var CategoryModel = require('../models/category');
var ProductModel = require('../models/product');
var CustomerModel = require('../models/customer')
const fs = require("fs");
const path = require("path");

const imagesExtensions = /.(png|jpg|jpeg)$/i;
const getImageFiles = (directory) => {
  try {
    return fs
      .readdirSync(directory)
      .filter((file) => imagesExtensions.test(file));
  } catch (error) {
    console.error(error.message);
    return [];
  }
};

router.get('/:slug', async (req,res)=>{
    try
    {
        const customerEmail = req.session.email; // Get email from session
  
      // Fetch customer ID based on email
      const customer = await CustomerModel.findOne({ email: customerEmail });
    //   if (!customer) {
    //     // Handle the case where no customer is found (e.g., redirect to login)
    //     return res.redirect('/auth');
    //   }
        

        const {slug} = req.params;
        const category = await CategoryModel.find().lean();
        const selectedCategory = await CategoryModel.findOne({slug: slug})

        if(!selectedCategory) {
            return res.status(404).send('Category not found')
        }
        const products = await ProductModel.find({categoryId: selectedCategory.id}).lean()
        const productBigData = await Promise.all(products.map(async (product) => {
        
            const imagesDirectory = path.join(__dirname, product.photo);
            const imageFiles = getImageFiles(imagesDirectory);
            const imagesWithUrls = imageFiles.map((file) => `/uploads/${product._id}/${file}`);
    
            return {
              ...product,
              images: imagesWithUrls,
            };
          }));
        res.render('category/categoryPage',{
            products: productBigData,
            category: category,
            selectedCategory: selectedCategory,
            customer
        })
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
})

module.exports = router;