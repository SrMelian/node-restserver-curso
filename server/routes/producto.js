const express = require('express');
const _ = require('underscore');
const { verificaToken } = require('../middlewares/autenticacion');

let app = express();
let Producto = require('../models/producto');

// =====================================
// Obtener productos
// =====================================
app.get('/productos', verificaToken, (req, res) => {
    let condiciones = {
        disponible: true,
    };
    let desde = Number(req.query.desde) || 0;
    let limite = Number(req.query.limite) || 5;
    let orderBy = req.query.orderBy || 'nombre';

    Producto.find(condiciones)
        .skip(desde)
        .limit(limite)
        .sort(orderBy)
        .populate('usuario', 'nombre email')
        .populate('categoria', 'descripcion')
        .exec((err, productos) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    err,
                });
            }

            Producto.count(condiciones, (err, conteo) => {
                res.json({
                    ok: true,
                    productos,
                    cuantos: conteo,
                });
            });
        });
});

// =====================================
// Obtener un producto por ID
// =====================================
app.get('/productos/:id', verificaToken, (req, res) => {
    let id = req.params.id;

    Producto.findById(id)
        .populate('usuario', 'nombre email')
        .populate('categoria', 'descripcion')
        .exec((err, productoDB) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    err,
                });
            }

            if (!productoDB) {
                return res.status(500).json({
                    ok: false,
                    err: {
                        message: 'El producto no existe',
                    },
                });
            }

            res.json({
                ok: true,
                productoDB,
            });
        });
});

// =====================================
// Buscar productos
// =====================================
app.get('/productos/buscar/:termino', verificaToken, (req, res) => {
    let termino = req.params.termino;
    let regex = new RegExp(termino, 'i');

    Producto.find({nombre: regex,})
        .populate('categoria', 'descripcion')
        .exec((err, productos) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    err,
                });
            }

            if (!productos) {
                return res.status(400).json({
                    ok: false,
                    err: {
                        message: 'No hay ningún producto con ese nombre',
                    },
                });
            }

            res.json({
                ok: true,
                productos,
            });
        });
});

// =====================================
// Crear un nuevo producto
// =====================================
app.post('/productos', verificaToken, (req, res) => {
    let body = req.body;

    let producto = new Producto({
        nombre: body.nombre,
        precioUni: body.precioUni,
        descripcion: body.descripcion,
        categoria: body.categoria,
        usuario: req.usuario._id,
    });

    producto.save((err, productoDB) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                err,
            });
        }

        if (!productoDB) {
            return res.status(500).json({
                ok: false,
                err,
            });
        }

        res.json({
            ok: true,
            categoria: productoDB,
        });
    });
});

// =====================================
// Actualizar un producto
// =====================================
app.put('/productos/:id', verificaToken, (req, res) => {
    let id = req.params.id;
    let body = _.pick(req.body, ['nombre', 'precioUni', 'descripcion']);

    Producto.findByIdAndUpdate(id, body, { new: true, runValidators: true, }, (err, productoDB) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                err,
            });
        }

        if (!productoDB) {
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'El producto no existe',
                },
            });
        }

        res.json({
            ok: true,
            producto: productoDB,
        });
    });
});

// =====================================
// Borrar un producto
// =====================================
app.delete('/productos/:id', verificaToken, (req, res) => {
    let id = req.params.id;

    let cambiaEstado = {
        disponible: false,
    };

    Producto.findByIdAndUpdate(id, cambiaEstado, { new: true, }, (err, productoBorrado) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                err,
            });
        }

        res.json({
            ok: true,
            producto: productoBorrado,
        });
    })
    // No borrar, solo cambiar disponible a false
});

module.exports = app;