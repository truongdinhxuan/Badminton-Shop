var express = require('express');
var router = express.Router();
var CategoryModel = require('../models/category');
var ProductModel = require('../models/product');
var CustomerModel = require('../models/customer');
var ProductModel = require('../models/product');
var BrandModel = require('../models/brand');

const fs = require("fs");
const path = require("path");
// const { checkLoginSession } = require("../middlewares/auth");
/* GET home page. */
// router.get('/', async (req, res, next) {
//   res.render('index', { title: 'Hello World' });
// });
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

router.get('/',async(req,res) =>{
    try {
      // Fetch all products
      const currentPage = parseInt(req.query.page) || 1;
    const perPage = 9; // Số lượng sản phẩm mỗi trang

    // Lấy tất cả sản phẩm và phân trang
    const totalProducts = await ProductModel.countDocuments(); // Đếm tổng số sản phẩm
    const totalPages = Math.ceil(totalProducts / perPage); // Tính tổng số trang

    // Lấy các sản phẩm cho trang hiện tại (skip và limit)
    const products = await ProductModel.find()
      .skip((currentPage - 1) * perPage) // Bỏ qua số sản phẩm trước đó
      .limit(perPage) // Giới hạn số sản phẩm cho trang hiện tại
      .lean();
      
      const category = await CategoryModel.find().lean();

      const brand = await BrandModel.find().lean();

      const user = await CustomerModel.findOne({email: req.session.email}).lean();

      const productBigData = await Promise.all(products.map(async (product) => {
        
        const imagesDirectory = path.join(__dirname, product.photo);
        const imageFiles = getImageFiles(imagesDirectory);
        const imagesWithUrls = imageFiles.map((file) => `/uploads/${product._id}/${file}`);

        return {
          ...product,
          images: imagesWithUrls,
        };
      }));
        
      res.render('product', {
        layout: "/layout",
        category: category,
        brand: brand,
        product: productBigData,
        customer: user,
        currentPage: currentPage, // Trang hiện tại
        totalPages: totalPages,   // Tổng số trang
      }); 
    } catch (error) { 
      console.error('Error fetching products:', error);
      res.status(500).send('Internal Server Error');
    }
  })
router.get('/detail/:urlRewriteName', async (req, res) => {
    const urlRewriteName = req.params.urlRewriteName;

    try {
        // 1. Fetch the specific product
        const product = await ProductModel.findOne({ urlRewriteName }).lean(); // Changed to findOne
        console.log(product)
        // 2. Handle Image Processing ONLY for the found product
        const imagesDirectory = path.join(__dirname, product.photo);
        const imageFiles = getImageFiles(imagesDirectory);
        const imagesWithUrls = imageFiles.map((file) => `/uploads/${product._id}/${file}`);

        // 3. Combine Product with Images
        const productWithImages = {
            ...product,
            images: imagesWithUrls,
        };

        // Fetch categories and user (if needed)
        const category = await CategoryModel.findOne({id: product.categoryId}).lean();
        const brand = await BrandModel.findOne({id: product.brandId}).lean();
        const user = await CustomerModel.findOne({ email: req.session.email }).lean();

        // 4. Render the View
        res.render('product/detail', {
            layout: "layout",
            category: category,
            brand: brand,
            product: productWithImages, // Pass the single product with images
            customer: user,
        });
    } catch (error) {
        console.error('Error fetching product details:', error);
        res.status(500).send('Internal Server Error');
    }
  });
  module.exports = router;