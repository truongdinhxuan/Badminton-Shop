var express = require("express");
var router = express.Router();

var Order = require('../models/order')
var Category = require('../models/category')
var Brand = require('../models/brand')
var CustomerModel = require('../models/customer')
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
router.get('/:orderCode', async (req, res) => {
    const orderCode = req.params.orderCode;
    const user = await CustomerModel.findOne({email: req.session.email}).lean(); 
    try {
        const order = await Order.findOne({ orderCode: orderCode });
        if (order) {
            const items = order.items;

            const promises = Object.values(items).map(async (itemObj) => {
                const item = itemObj.item;
                
                // Tìm category và brand theo id
                const category = await Category.findOne({ id: item.categoryId });
                const brand = await Brand.findOne({ id: item.brandId });
                // xử lý image
                const imagesDirectory = path.join(__dirname, '..', 'public', 'uploads', item._id.toString());
                const imageFiles = getImageFiles(imagesDirectory);
                const imagesWithUrls = imageFiles.map((file) => `/uploads/${item._id}/${file}`);
                // Gắn thông tin category và brand name vào item
                return {
                    ...itemObj,
                    item: {
                        ...item,
                        categoryName: category ? category.name : 'Unknown Category',
                        brandName: brand ? brand.name : 'Unknown Brand',
                        image: imagesWithUrls
                    }
                };
            });

            // Đợi tất cả các promise hoàn thành
            const updatedItems = await Promise.all(promises);

            //xử lý status order
            let activeSteps = [];
            let showreturnsteps = false;
            let showCancelButton = false;

            if (order.statusId >= 6 && order.statusId <= 10) {
                showreturnsteps = true; // Hiển thị bước hoàn trả hàng nếu status là 6, 7, hoặc 8
            }
            //canceled
            if (order.statusId === 1 || order.statusId === 2 || order.statusId === 3) {
                showCancelButton = true; // Hiển thị nút canceled cho status 1, 2, 3
            }
            // hoàn trả
            if (order.statusId === 6) {
                activeSteps = [6]
            } else if (order.statusId === 7) {
                activeSteps = [6,7]
            } else if (order.statusId === 8) {
                activeSteps = [6,7.8]
            // giao hàng
            } else if (order.statusId === 1) {
                activeSteps = [1]; // chỉ step 1 active
            } else if (order.statusId === 2) {
                activeSteps = [1, 2]; // step 1 và 2 active
            } else if (order.statusId === 3) {
                activeSteps = [1, 2, 3]; // step 1, 2 và 3 active
            } else if (order.statusId == 4) {
                activeSteps = [1,2,3,4]
            } else if (order.statusId == 5) {
                activeSteps = [1,2,3,4,5]
            }

            res.render('order/orderPage', {
                layout: 'layout',
                order: order,
                customer: user.name,
                items: updatedItems,
                activeSteps: activeSteps,
                showreturnsteps: showreturnsteps,
                showCancelButton: showCancelButton
            });
        } else {
            // chỗ này làm cái render no login
            res.status(404).send('Order not found or you must login to see this order');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});


module.exports = router;