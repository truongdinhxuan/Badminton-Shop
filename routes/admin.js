// const Passport = require('passport');
var express = require("express");
var router = express.Router();
//Models
const OrderModel = require('../models/order');
const ProductModel = require('../models/product');
const AdminModel = require('../models/admin');
const CustomerModel = require('../models/customer');
const CategoryModel = require('../models/category');
const Charset = require('../modules/charset');
const multer = require("multer");
// const OrderStatus = require('../constants/order-status');

// Admin index
router.get('/', async (req, res) => {
    // Dashboard.... Chinh sau
    const order = await OrderModel.find().count();
    const product = await ProductModel.find().count();
    const user = await  AdminModel.findOne({ email: req.session.email }).lean();
    
    res.render("admin/index", {
    layout: "admin/layout/layout",
    admin: user.name,
    order: order,
    product: product
    });
});
// CATEGORY
router.get('/category', async (req, res) => {
    const category = await CategoryModel.find().lean();

    res.render("admin/category" , {
    layout: "admin/layout/layout",
    data:category
    })
})
router.get('/add-category', async (req, res) => {
    

    res.render("admin/category/add-category" , {
    layout: "admin/layout/layout",
    
    })
})
router.post('/add-category', async (req, res) => {
    var controlData = req.body
    
    try {
        let info = {
            id: await CategoryModel.countDocuments() + 1,
            name: controlData.name,
            urlRewriteName: Charset.removeUnicode(req.body.name),
            isDeleted: false
        }
        await CategoryModel.create(info);
        res.redirect('/admin/category')
    } catch (errors) {
        console.log(errors)
        res.redirect('/admin')
    } 
})
router.get('/delete-all-category', async (req, res) => {
    try {
        await CategoryModel.deleteMany({}); // Delete all documents
        res.redirect('/admin/category');
    } catch (error) {
        console.error("Error deleting all categories:", error);
        // Handle the error appropriately, e.g., display an error message
        res.redirect('/admin/category?error=true'); 
    }
})
router.get("/delete-category/:id", async (req, res) => {
    const categoryId = req.params.id;
    await CategoryModel.findByIdAndDelete(categoryId).lean();
  
    res.redirect("/admin/category");
  });
router.get("/update-category/:id", async (req, res) => {
    const categoryId = req.params.id;
    const updateCat = await CategoryModel.findById(categoryId).lean();

    res.render('admin/category/update-category' ,{
        layout: "admin/layout/layout",
        updateCat: updateCat,
    });
  });
router.post("/update-category/:id", async (req, res) => {
    
    try {
        const categoryID = req.params.id;
        const data = req.body
        await CategoryModel.findByIdAndUpdate(categoryID, data).lean();
    
        res.redirect("/admin/category")
    } catch (errors) {
        console.log(errors)
        res.redirect('/admin')
    }
})
// PRODUCT
router.get('/product', async (req, res) => {
    try {
        // Fetch all products
        const products = await ProductModel.find().lean();

        // Fetch categories for all products
        const productWithCategory = await Promise.all(products.map(async (product) => {
            const category = await CategoryModel.findOne({ id: product.categoryId }).lean();    
            return {
                ...product,
                categoryName: category ? category.name : 'Uncategorized'
            };
        }));

        res.render('admin/product', {
            layout: "/admin/layout/layout",
            data: productWithCategory
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;