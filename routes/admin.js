// const Passport = require('passport');
var express = require("express");
var router = express.Router();
//Models
const { checkLoginSession } = require("../middlewares/auth");
const OrderModel = require('../models/order');
const ProductModel = require('../models/product');
const AdminModel = require('../models/admin');
const CustomerModel = require('../models/customer');
const CategoryModel = require('../models/category');
const BrandModel = require('../models/brand');
const Charset = require('../modules/charset');
const multipart = require("connect-multiparty");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { count } = require("console");
// const OrderStatus = require('../constants/order-status');

// Admin index
router.get('/',checkLoginSession, async (req, res) => {
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
const imagesExtensions = /.(png|jpg|jpeg)$/i;

const upload = multer({
  storage: multer.memoryStorage(),
});

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

router.get('/product', async (req, res) => {
  try {
    // Fetch all products
    const products = await ProductModel.find().lean();
    
    const productBigData = await Promise.all(products.map(async (product) => {
      const category = await CategoryModel.findOne({ id: product.categoryId }).lean();
      
      const imagesDirectory = path.join(__dirname, product.photo);

      const imageFiles = getImageFiles(imagesDirectory);
      
      // Construct URLs for images
      const imagesWithUrls = imageFiles.map((file) => `/uploads/product/${product._id}/${file}`);

      return {
        ...product,
        categoryName: category ? category.name : 'Uncategorized', 
        images: imagesWithUrls
      };
    }));
        
    res.render('admin/product', {
      layout: "/admin/layout/layout",
      data: productBigData,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).send('Internal Server Error');
  }
});
router.get('/add-product', async (req, res) => {
  const category = await CategoryModel.find({}).lean();
  
  res.render("admin/product/add-product" , {
    layout: "admin/layout/layout",
    data: category
    })
})
router.post('/add-product', upload.fields([{name: "photo",maxCount: 10}]), async (req, res) => {
  const name = req.body.name
  const categoryId = req.body.categoryId
  // const category = await CategoryModel.findOne({name: categoryName}).lean();
  // const categoryId = category.id
  const description = req.body.description
  const price = req.body.price
  const isDisplay = req.body.isDisplay === 'on';
  console.log(req.body)
  try {
    const newProduct = new ProductModel({
      id: await ProductModel.countDocuments() + 1,
      categoryId: categoryId,
      name: name,
      urlRewriteName: Charset.removeUnicode(req.body.name),
      photo: "",
      description: description,
      price: price,
      isDisplay: isDisplay
    })
    const savedProduct = await newProduct.save();
    const productFolderPath = path.join(__dirname, "../public/uploads/product", savedProduct._id.toString())
    
    const photo = path.join(productFolderPath);
    
    createFolder(photo);

    await savedProduct.updateOne({photo: `../public/uploads/product/${savedProduct._id.toString()}`});
    
    await saveFilesFromMemory(req.files.photo, photo);
    res.redirect("/admin/product",)
  } catch(error) {
    console.error("Error handling product and image:", error);
    res.redirect("/admin")
  }

})

async function saveFilesFromMemory(files, destPath) {
  if (files) {
    files.forEach((file) => {
      const sanitizedFileName = file.originalname.replace(/\s+/g, '_');
      const destFilePath = path.join(destPath, sanitizedFileName);
      fs.writeFileSync(destFilePath, file.buffer);
    });
  }
}

function createFolder(folderPath) {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
}


router.get("/delete-product/:id", async (req, res) => {
  const productId = req.params.id;
  await ProductModel.findByIdAndDelete(productId).lean();
  
  res.redirect("/admin/product");
});
router.get("/update-product/:id", async (req, res) => {
  const productId = req.params.id;
  const updateProduct = await ProductModel.findById(productId).lean();
  const category = await CategoryModel.find({}).lean();
  
  const selectedCategory = category.find(category => category.id === updateProduct.categoryId);

  res.render('admin/product/update-product' ,{
      layout: "admin/layout/layout",
      updateProduct: updateProduct,
      data: category,
      selectedCategory: selectedCategory,
      isDisplay: updateProduct.isDisplay,
  });
});
router.post("/update-product/:id",upload.fields([{name: "photo",maxCount: 10}]), async (req, res) => {
  try {
      const productId = req.params.id;
      const name = req.body.name;
      const categoryId = req.body.categoryId;
      const description = req.body.description;
      const price = req.body.price;
      const isDisplay = req.body.isDisplay === 'on'
      await ProductModel.findByIdAndUpdate(productId , {
        name: name,
        categoryId: categoryId,
        description: description,
        price: price,
        isDisplay: isDisplay
      })
      
      const productFolderPath = path.join(__dirname, "../public/uploads/product", productId.toString())

      const imagesPath = path.join(productFolderPath);

      await saveFilesFromMemory(req.files.photo, imagesPath);

      res.redirect("/admin/product")
  } catch (errors) {
      console.log(errors)
      res.redirect('/admin')
  }
}) 
router.get('/delete-all-product', async (req, res) => {
  try {
      await ProductModel.deleteMany({}); // Delete all documents
      res.redirect('/admin/product');
  } catch (error) {
      console.error("Error deleting all categories:", error);
      // Handle the error appropriately, e.g., display an error message
      res.redirect('/admin/product?error=true'); 
  }
})

// BRAND
router.get('/brand', async (req, res) => {
  try {
    // Fetch all brand
    const brand = await BrandModel.find().lean();
    
    const brandBigData = await Promise.all(brand.map(async (brand) => {
      const category = await CategoryModel.findOne({ id: brand.categoryId }).lean();

      return {
        ...brand,
        categoryName: category ? category.name : 'Uncategorized', 
      };
    }));
        
    res.render('admin/brand', {
      layout: "/admin/layout/layout",
      data: brandBigData,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).send('Internal Server Error');
  }
});
router.get('/add-brand', async (req, res) => {
  const category = await CategoryModel.find({}).lean();

  res.render("admin/brand/add-brand" , {
    layout: "admin/layout/layout",
    data: category
  })
})
router.post('/add-brand', async (req, res) => { 
  var controlData = req.body
  
  try {
      let info = {
          id: await BrandModel.countDocuments() + 1,
          name: controlData.name,
          categoryId: controlData.categoryId,
          urlRewriteName: Charset.removeUnicode(req.body.name),
      }
      await BrandModel.create(info);
      res.redirect('/admin/brand')
  } catch (errors) {
      console.log(errors)
      res.redirect('/admin')
  } 
});
router.get("/delete-brand/:id", async (req, res) => {
  const brandId = req.params.id;
  await BrandModel.findByIdAndDelete(brandId).lean();
  
  res.redirect("/admin/brand");
});
router.get("/update-brand/:id", async (req, res) => {
  const brandId = req.params.id;
  const updateBrand = await BrandModel.findById(brandId).lean();
  const category = await CategoryModel.find({}).lean();

  const selectedCategory = category.find(category => category.id === updateBrand.categoryId);
  res.render('admin/brand/update-brand' ,{
      layout: "admin/layout/layout",
      updateBrand: updateBrand,
      data: category,
      selectedCategory: selectedCategory,
  });
});
router.post("/update-brand/:id", async (req, res) => {
  try {
      const brandId = req.params.id;
      const data = req.body
      await BrandModel.findByIdAndUpdate(brandId, data).lean();
  
      res.redirect("/admin/brand")
  } catch (errors) {
      console.log(errors)
      res.redirect('/admin')
  }
})
router.get('/delete-all-brand', async (req, res) => {
  try {
      await BrandModel.deleteMany({}); // Delete all documents
      res.redirect('/admin/brand');
  } catch (error) {
      console.error("Error deleting all categories:", error);
      // Handle the error appropriately, e.g., display an error message
      res.redirect('/admin/brand?error=true'); 
  }
})
module.exports = router;