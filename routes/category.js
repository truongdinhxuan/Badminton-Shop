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
      const customer = await CustomerModel.findOne({ email: customerEmail });

        const {slug} = req.params;
        const category = await CategoryModel.find().lean();
        const selectedCategory = await CategoryModel.findOne({slug: slug})

        if(!selectedCategory) {
            return res.status(404).send('Category not found')
        }

        const currentPage = parseInt(req.query.page) || 1;
        const perPage = 9; // Số lượng sản phẩm mỗi trang

        // Lấy tất cả sản phẩm và phân trang
        const totalProducts = await ProductModel.countDocuments(); // Đếm tổng số sản phẩm
        const totalPages = Math.ceil(totalProducts / perPage); // Tính tổng số trang

        const products = await ProductModel.find({categoryId: selectedCategory.id}).skip((currentPage - 1) * perPage) // Bỏ qua số sản phẩm trước đó
        .limit(perPage) // Giới hạn số sản phẩm cho trang hiện tại
        .lean();
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
            customer,
            currentPage: currentPage, // Trang hiện tại
            totalPages: totalPages,
        })
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
})

module.exports = router;