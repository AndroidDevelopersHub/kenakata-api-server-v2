const express = require("express");
const db = require("./db");
const router = express.Router();
let jwt = require("jsonwebtoken");
const config = require("../../middleware/config.json"); // refresh
let tokenChecker = require("../../middleware/tockenchecker");
const tokenList = {};
const _response = require('../common/middleware/api-response')
const responsemsg = require('../common/middleware/response-msg')
const responsecode = require('../common/middleware/response-code')
const response = require('../common/middleware/api-response')
const Joi = require('@hapi/joi')
const bcrypt = require('bcrypt');
const commonServe = require('../common/services/commonServices')



module.exports = function (router) {
    router.get('/:table_name/', list);
    router.post('/:table_name', add);
    router.put('/:table_name/:id', update);
    router.get('/:table_name/:id', details);
    router.delete('/:table_name/:id', _delete);
    router.post('/user/login', login);
    router.post('/admin/login', admin_login);
    router.post('/uploads')
    router.delete('/cart/:user_id/:product_id', _deleteCart);
}

function _deleteCart(req,res){
    db.query("DELETE FROM `cart` WHERE product_id='"+req.params.product_id+"' AND user_id = '"+req.params.user_id+"' ", (err, result) => {
        if (!err) {
            return _response.apiSuccess(res, responsemsg.deleteSuccess)
        } else {
            return _response.apiFailed(res, err)
        }
    });
}

function admin_login(req, res){
    let email = req.body.email;
    let password = req.body.password;

    db.query("SELECT * FROM `admin` WHERE `email` = '"+email+"' AND `password` = '"+password+"' ", (err, result) => {
        if (!err) {
            return _response.apiSuccess(res, result.length+" "+responsemsg.found , result )

        } else {
            return _response.apiFailed(res, responsemsg.listIsEmpty ,err)
        }
    });
}

function login(req, res){
    let email = req.body.email;
    let password = req.body.password;

    db.query("SELECT * FROM `user` WHERE `email` = '"+email+"' AND `password` = '"+password+"' ", (err, result) => {
        if (!err) {
            return _response.apiSuccess(res, result.length+" "+responsemsg.found , result )

        } else {
            return _response.apiFailed(res, responsemsg.listIsEmpty ,err)
        }
    });
}


function add(req, res){
    const table_name = req.params.table_name

    if (table_name === "uploads"){
        try {
            if(!req.files) {
                res.send({
                    status: false,
                    message: 'No file uploaded'
                });
            } else {
                //Use the name of the input field (i.e. "avatar") to retrieve the uploaded file
                let avatar = req.files.avatar;

                //Use the mv() method to place the file in upload directory (i.e. "uploads")
                avatar.mv('./uploads/' + avatar.name);

                //send response
                res.send({
                    url: "https://live.allgame365.online/"+avatar.name
                });
            }
        } catch (err) {
            res.status(500).send(err);
        }
    }

    if (table_name === "checkout"){

        db.query("DELETE FROM `cart` WHERE product_id='"+req.body.product_id+"' AND user_id = '"+req.body.user_id+"' ", (err, result) => {
            if (!err) {

                db.query("INSERT INTO "+table_name+" SET ?", req.body , (err, result) => {
                    if (!err) {
                        return _response.apiSuccess(res, responsemsg.saveSuccess , result)
                    } else {
                        return _response.apiFailed(res, err , result)
                    }
                });

            } else {
                return _response.apiFailed(res, err)
            }
        });
    }

    db.query("INSERT INTO "+table_name+" SET ?", req.body , (err, result) => {
        if (!err) {
            return _response.apiSuccess(res, responsemsg.saveSuccess , result)
        } else {
            return _response.apiFailed(res, err , result)
        }
    });
}


async function list(req ,res ){
    const table_name = req.params.table_name

    var limit = 500;
    var page = 1;
    var totalDocs = 0;
    if (req.query.page){
        page = req.query.page
    }
    if (req.query.limit){
        limit = req.query.limit
    }
    var offset = (page - 1) * limit


    db.query("SELECT COUNT(*) AS "+table_name+" FROM products", (err, result) => {
        if (!err) {
            totalDocs = result[0].total
        } else {

        }
    });

    //Search by String
    if (req.query.search_string && req.query.search_string !== ''){

        db.query("SELECT * FROM "+table_name+" WHERE CONCAT("+req.query.search_table+") REGEXP '"+req.query.search_string+"'  LIMIT "+limit+" OFFSET "+offset+" ", (err, result) => {
            if (!err && result.length > 0) {
                return _response.apiSuccess(res, result.length+" "+responsemsg.found , result,{page: parseInt(page) , limit: parseInt(limit),totalDocs: totalDocs })
            } else {
                return _response.apiFailed(res, responsemsg.listIsEmpty)
            }
        });

    }else {
        db.query("SELECT * FROM "+table_name+" LIMIT "+limit+" OFFSET "+offset+" ", (err, result) => {
            if (!err) {
                return _response.apiSuccess(res, result.length+" "+responsemsg.found , result , {page: parseInt(page) , limit: parseInt(limit),totalDocs: totalDocs })

            } else {
                return _response.apiFailed(res, responsemsg.listIsEmpty )
            }
        });
    }


}


function update(req ,res ){
    const table_name = req.params.table_name

    if (req.params.id){
        db.query("SELECT * FROM "+table_name+" WHERE id='"+req.params.id+"'", (err, result) => {
            if (!err && result.length > 0) {

                db.query("UPDATE request SET ? WHERE id = '"+req.params.id+"'" , req.body ,(err , result) =>{
                    if (!err){
                        return _response.apiSuccess(res, responsemsg.updateSuccess)
                    }else{
                        return _response.apiFailed(res, err)
                    }
                })

            } else {
                return _response.apiFailed(res, err)
            }
        });

    }else {
        return  _response.apiWarning(res, 'Please select id.')
    }
}


function details(req ,res ){
    //const result = bcrypt.compareSync('123', hash);
    const table_name = req.params.table_name

    if (req.params.id){
        db.query("SELECT * FROM "+table_name+" WHERE id='"+req.params.id+"'", (err, result) => {
            if (!err && result.length > 0) {
                return _response.apiSuccess(res, result.length+" "+responsemsg.userFound ,result)
            } else {
                return _response.apiWarning(res , responsemsg.userListIsEmpty)
            }
        });
    }else {
        return _response.apiWarning(res , 'Please select id')
    }
}


function _delete(req ,res){
    const table_name = req.params.table_name

    if (req.params.id){
        db.query("SELECT * FROM "+table_name+" WHERE id='"+req.params.id+"'", (err, result) => {
            if (!result.length){
                return _response.apiWarning(res, responsemsg.userListIsEmpty)
            }else {
                db.query("DELETE FROM "+table_name+" WHERE id='" + req.params.id + "'", (err, result) => {
                    if (!err) {
                        return _response.apiSuccess(res, responsemsg.userDeleteSuccess)
                    } else {
                        return _response.apiFailed(res, err)
                    }
                });
            }

        });
    }else {
        return _response.apiWarning(res , 'Please select id')
    }
}

