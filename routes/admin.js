// const Passport = require('passport');
var express = require("express");
var router = express.Router();
//Models
const { checkLoginSession } = require("../middlewares/auth");
const OrderModel = require('../models/order');
const ProductModel = require('../models/product');
const AdminModel = require('../models/admin');
const CustomerModel = require('../models/customer');
const StaffModel = require('../models/staff')
const RoleModel = require('../models/roles')
const CategoryModel = require('../models/category');
const BrandModel = require('../models/brand');
const StatusModel = require('../models/status');
const ReportModel = require('../models/report');
const Charset = require('../modules/charset');
const multipart = require("connect-multiparty");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { count } = require("console");
const slugify = require('slugify');
const Order = require("../models/order");

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
            slug: slugify(controlData.name, { lower: true, strict: true }) // Tạo slug từ tên
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
      
      const brand = await BrandModel.findOne({id: product.brandId}).lean();

      const imagesDirectory = path.join(__dirname, product.photo);

      const imageFiles = getImageFiles(imagesDirectory);
      
      // Construct URLs for images
      const imagesWithUrls = imageFiles.map((file) => `/uploads/${product._id}/${file}`);

      return {
        ...product,
        categoryName: category ? category.name : 'Uncategorized', 
        brandName: brand ? brand.name : 'Uncategorized',
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
  const brand = await BrandModel.find({}).lean();
  res.render("admin/product/add-product" , {
    layout: "admin/layout/layout",
    category: category,
    brand: brand
    })
})
router.post('/get-brands', async (req, res) => {
  const categoryId = req.body.categoryId;
  const brands = await BrandModel.find({ categoryId: categoryId }).lean();
  res.json(brands);
}); 
router.post('/add-product', upload.fields([{name: "photo",maxCount: 10}]), async (req, res) => {
  const name = req.body.name
  const categoryId = req.body.categoryId
  // const category = await CategoryModel.findOne({name: categoryName}).lean();
  // const categoryId = category.id
  const brandId = req.body.brandId
  const description = req.body.description
  const price = req.body.price
  const isDisplay = req.body.isDisplay === 'on';
  console.log(req.body)
  try {
    const newProduct = new ProductModel({
      id: await ProductModel.countDocuments() + 1,
      categoryId: categoryId,
      brandId: brandId,
      name: name,
      urlRewriteName: Charset.removeUnicode(req.body.name),
      photo: "",
      description: description,
      price: price,
      isDisplay: isDisplay
    })
    const savedProduct = await newProduct.save();
    const productFolderPath = path.join(__dirname, "../public/uploads", savedProduct._id.toString())
    
    const photo = path.join(productFolderPath);
    
    createFolder(photo);

    await savedProduct.updateOne({photo: `../public/uploads/${savedProduct._id.toString()}`});
    
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
  const brand = await BrandModel.find({}).lean();
  const selectedCategory = category.find(category => category.id === updateProduct.categoryId);
  const selectedBrand = brand.find(brand => brand.id === updateProduct.brandId);
  res.render('admin/product/update-product' ,{
      layout: "admin/layout/layout",
      updateProduct: updateProduct,
      data: category,
      selectedCategory: selectedCategory,
      selectedBrand: selectedBrand,
      isDisplay: updateProduct.isDisplay,
  });
});
router.post("/update-product/:id",upload.fields([{name: "photo",maxCount: 10}]), async (req, res) => {
  try {
      const productId = req.params.id;
      const name = req.body.name;
      const categoryId = req.body.categoryId;
      const brandId = req.body.brandId;
      const description = req.body.description;
      const price = req.body.price;
      const isDisplay = req.body.isDisplay === 'on'
      await ProductModel.findByIdAndUpdate(productId , {
        name: name,
        categoryId: categoryId,
        brandId: brandId,
        description: description,
        price: price,
        isDisplay: isDisplay
      })
      
      const productFolderPath = path.join(__dirname, "../public/uploads", productId.toString())

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
          slug: Charset.removeUnicode(req.body.name),
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

// ORDER
router.get('/order/isdeleted', async (req,res) => {
  const deleteOrder = await OrderModel.find({statusId: 11}).lean()

  res.render('admin/order/isdeleted',{
    layout: 'admin/layout/layout',
    deleteOrder: deleteOrder
  })
})
router.get('/order', async (req ,res) => {
  const orders = await OrderModel.find({isDelete: false}).lean();
  
  const orderData = await Promise.all(
    orders.map(async (order) => {
        const status = await StatusModel.findOne({id: order.statusId}).lean();
        const report = await ReportModel.findOne({ orderId: order.orderCode, isAccepted: false}).lean();
        return {
            ...order,
            iscancelled: status && status.name === 'Canceled' && order.paymentMethod === 'bank',
            statusName: status ? status.name : 'Unknow',
            reportTitle: report ? report.title : null,
            reportMessage: report ? report.message : null,
        };
    })
  );

  // console.log(orderData)

  const countReport = await ReportModel.countDocuments({isAccepted: false})
  const countCanceledOrder = await OrderModel.findOne({statusId: 11, paymentMethod: 'bank'}).countDocuments()
  // const bigData = await Promise.all(orders.map(async (order) => {
  //   const status = await StatusModel.findOne({id: order.statusId}).lean();
  //   return {
  //     ...order,
  //     statusName: status ? status.name : 'Unknow'
  //   };
  // }))   
  res.render('admin/order' , {
    layout: 'admin/layout/layout',
    // data: bigData,
    order: orderData,
    countReport: countReport,
    countCanceledOrder: countCanceledOrder
  })
})

router.get('/update-order/:id', async (req,res) => {
  const orderId = req.params.id
  const updateOrder = await OrderModel.findById(orderId).lean()
  let orderCode = updateOrder.orderCode
  const status = await StatusModel.find({}).lean()
  const report = await ReportModel.findOne({ orderId: orderCode }).lean();

  const selectedStatus = status.find(status => status.id === updateOrder.statusId)

  let activeSteps = [];
  let showreturnsteps = false;

  if (updateOrder.statusId >= 6 && updateOrder.statusId <= 10) {
    showreturnsteps = true; // Hiển thị bước hoàn trả hàng nếu status là 6, 7, hoặc 8
  }
  // hoàn trả
  if (updateOrder.statusId === 6) {
    activeSteps = [6]
  } else if (updateOrder.statusId === 7) {
    activeSteps = [6,7]
  } else if (updateOrder.statusId === 8) {
    activeSteps = [6,7.8]
  // giao hàng
  } else if (updateOrder.statusId === 1) {
    activeSteps = [1]; // chỉ step 1 active
  } else if (updateOrder.statusId === 2) {
    activeSteps = [1, 2]; // step 1 và 2 active
  } else if (updateOrder.statusId === 3) {
    activeSteps = [1, 2, 3]; // step 1, 2 và 3 active
  } else if (updateOrder.statusId == 4) {
    activeSteps = [1,2,3,4]
  } else if (updateOrder.statusId == 5) {
    activeSteps = [1,2,3,4,5]
  }

  // const formatMoney = new Intl.NumberFormat('vi-VI', {
  //   style: 'currency',
  //   currency: 'VND'
  // }).format(updateOrder.amount)
  
  res.render('admin/order/update-order', {
    layout: 'admin/layout/layout',
    updateOrder: updateOrder,
    status: status,
    selectedStatus: selectedStatus,
    report: report,
    activeSteps: activeSteps,
    showreturnsteps: showreturnsteps,
   
  })
})
router.post('/update-order/:id', async (req, res) => {
  try { 
    const orderId = req.params.id;
    const data = req.body;
    const updatedOrder = await OrderModel.findByIdAndUpdate(orderId, data, { new: true }).lean();
    if (!updatedOrder) {
      console.error(`Order with ID ${orderId} not found`);
      return res.status(404).send("Order not found");
    }
    const orderCode = updatedOrder.orderCode;
    if (!orderCode) {
      console.error("Order code is missing");
      return res.status(400).send("Order code is missing");
    }
    await ReportModel.findOneAndDelete({ orderId: orderCode }).lean();

    res.redirect('/admin/order');
  } catch (errors) {
    console.error("Error updating order:", errors);
    res.redirect('/admin');
  }
});
router.post('/order/update-status-order/:id', async (req, res) => {
  try {
      // Get the order ID from the URL
      const id = req.params.id;
      const newStatusId = req.body.action === 'accept' ? 7 : 8; // Example: 7 for "Accepted", 8 for "Refused"
      
      // Update the order's status
      const updatedOrder = await OrderModel.findOneAndUpdate(
          { _id: id },
          { statusId: newStatusId },
          { new: true }
      );

      if (updatedOrder) {
          // If the order is updated, proceed to update the report
          const report = await ReportModel.findOne({ orderId: updatedOrder.orderCode }).lean(); // Use orderCode from OrderModel to find the report
          if (report) {
              // Update isAccepted status in ReportModel
              await ReportModel.findOneAndUpdate(
                  { orderId: updatedOrder.orderCode }, // Ensure the report is matched using orderCode
                  { isAccepted: req.body.action === 'accept' }, // Set isAccepted based on the action (accept or not)
                  { new: true }
              );
              req.flash('success', `Order status updated to ${newStatusId === 7 ? 'Accepted' : 'Refused'}`);
          } else {
              req.flash('error', 'Report not found for the order.');
          }
      } else {
          req.flash('error', 'Order not found or could not be updated.');
      }

      // Redirect back to the orders page
      res.redirect(`/admin/update-order/${id}`);
  } catch (error) {
      console.error('Error updating order status:', error);
      req.flash('error', 'An error occurred while updating the order status.');
      res.redirect('/admin/order');
  }
});
// customer
router.get('/account/customer', async (req,res) =>{
  const customer = await CustomerModel.find().lean()
  console.log(customer)

  res.render('admin/account/customer',{
    layout: 'admin/layout/layout',
    customer
  })
})
router.get('/account/customer/update-customer/:id', async (req,res) =>{
  const customerId = req.params.id
  const updateCustomer = await CustomerModel.findById(customerId).lean()
  const orderCount = await OrderModel.countDocuments({buyerId: updateCustomer.id, statusId: 5})
  console.log(orderCount)
  res.render('admin/account/customer/update-customer', {
    layout: 'admin/layout/layout',
    updateCustomer: updateCustomer,
    orderCount: orderCount
  })
})
router.post('/account/customer/update-customer/:id', async (req,res) =>{
  try {
    const customerId = req.params.id;
    const email = req.body.email
    const name = req.body.name
    const password = req.body.password

    await CustomerModel.findByIdAndUpdate(customerId, {
      email: email,
      name: name,
      password: password
    });

    res.redirect("/admin/account/customer")
} catch (errors) {
    console.log(errors)
    res.redirect('/admin/account/customer')
}
})
// delete -> disable
router.post('/account/customer/disable-customer/:id', async (req, res) => {
  const customerId = req.params.id;

  try {
    // Tìm khách hàng theo ID
    const customer = await CustomerModel.findById(customerId);

    // Kiểm tra và thay đổi trạng thái isDisable
    switch (customer.isDisable) {
      case true:
        // Nếu isDisable là true, chuyển thành false
        await CustomerModel.findByIdAndUpdate(customerId, { isDisable: false });
        break;
      case false:
        // Nếu isDisable là false, chuyển thành true
        await CustomerModel.findByIdAndUpdate(customerId, { isDisable: true });
        break;
      default:
        // Nếu isDisable không phải là true/false (trường hợp bất thường)
        res.status(400).send('Invalid state');
        return;
    }

    // Sau khi cập nhật, chuyển hướng về trang danh sách khách hàng
    res.redirect("/admin/account/customer");
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

// Staff
router.get('/account/staff', async (req,res) =>{
  const staff = await StaffModel.find().lean()
  console.log(staff)

  res.render('admin/account/staff',{
    layout: 'admin/layout/layout',
    staff
  })
})
router.get('/account/staff/add-staff', async (req,res) =>{
  res.render("admin/account/staff/add-staff" , {
    layout: "admin/layout/layout",
    })
})
router.post('/account/staff/add-staff', async (req,res) =>{
  const name = req.body.name
  const email = req.body.email
  const password = req.body.password
  const staffRole = await RoleModel.findOne({roleName: "staff"}).lean();
  
  const existingStaff = await StaffModel.findOne({
    email: email

  })
  if(existingStaff) {
    return res.render('admin/account/staff/add-staff',{
      layout: 'admin/layout/layout',
      message: 'Duplicate email'
    })
  }

    try {
        let info = {
            id: await StaffModel.countDocuments() + 1,
            email: email,
            name: name,
            password: password,
            roleID: staffRole._id
        }
        await StaffModel.create(info);
        res.redirect('/admin/account/staff')
    } catch (errors) {
        console.log(errors)
        res.redirect('/admin/account/staff')
    }
})
router.get('/account/staff/update-staff/:id', async (req,res) =>{
  const staffId = req.params.id
  const updateStaff = await StaffModel.findById(staffId).lean()

  res.render('admin/account/staff/update-staff', {
    layout: 'admin/layout/layout',
    updateStaff: updateStaff
  })
})
router.post('/account/staff/update-staff/:id', async (req,res) =>{
  try {
    const staffId = req.params.id;
    const email = req.body.email
    const name = req.body.name
    const password = req.body.password
    // const existingStaff = await StaffModel.findOne({
    //   email: email
  
    // })
    // if(existingStaff) {
    //   return res.render('admin/account/staff/update-staff',{
    //     layout: 'admin/layout/layout',
    //     message: 'Duplicate email'
    //   })
    // }
    await StaffModel.findByIdAndUpdate(staffId, {
      email: email,
      name: name,
      password: password
    }, { new: true });

    res.redirect("/admin/account/staff")
} catch (errors) {
    console.log(errors)
    res.redirect('/admin/account/staff')
}
})
router.post('/account/staff/delete-staff/:id', async (req,res) => {
  const staffId = req.params.id;
  await StaffModel.findByIdAndDelete(staffId).lean();
  
  res.redirect("/admin/account/staff");
})
module.exports = router;