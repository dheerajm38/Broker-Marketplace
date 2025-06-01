// import express from 'express';
// import { Employee } from '../Model/Models.js';
// import { apiResponse } from '../Functionality/ApiResponse.js';
// import { authMiddleware } from '../Middleware/AuthMiddleware.js';
// const router = express.Router();

// // Fetch Details on the basis of role for Employee/Admin
// router.get('/fetchDetails/:role', authMiddleware, async(req, res) => {
//     console.log('FetchDetail called for employee', req.params.role);
//     const role = req.params.role;
//     try {
//         const employeeList = await Employee.scan('role').eq(role).exec();
//         console.log('Employee List',employeeList);
//         res.status(200).json(employeeList);
//     } catch (error) {
//         console.log(error);
//     }
// });

// // Employee or Admin Register
// router.post('/register/:role', authMiddleware, async(req,res) => {
//     console.log("Register Employee request received - {}", req.body);
//     try{
//         const { fullName, 
//             email,
//             mobile,
//             street,
//             city,
//             district,
//             state,
//             zipCode } = req.body
//         const role = req.params.role;
//         let created_by = req.userName || 'admin';

//         const newEmployee = new Employee({
//             personal_details: {
//                 fullName
//             },
//             contact_details: {
//                 email,
//                 phone_number:mobile,
//                 address: {
//                     street,
//                     city,
//                     district,
//                     state,
//                     zipCode
//                 }
//             },
//             role,
//             created_by
//             });
//         await newEmployee.save();
//         res.status(201).json(apiResponse(201));
//     } catch (error) {
//         console.log(error);
//     }
// });

// export default router;