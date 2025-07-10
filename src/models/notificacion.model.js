const mongoose = require('mongoose');

const NotificacionSchema = new mongoose.Schema({
    notificacion_id: {
        type: String,
        required: true,
        unique: true
    },
    usuario_id: {
        type: String,
        required: true,
        index: true
    },
    tipo: {
        type: String,
        required: true,
        enum: ['orden_creada', 'orden_pagada', 'orden_enviada', 'orden_entregada', 'orden_cancelada', 'resena_recibida', 'producto_favorito', 'oferta_especial']
    },
    titulo: {
        type: String,
        required: true
    },
    mensaje: {
        type: String,
        required: true
    },
    leida: {
        type: Boolean,
        default: false
    },
    datos_adicionales: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    fecha_creacion: {
        type: Date,
        default: Date.now
    },
    fecha_lectura: {
        type: Date,
        default: null
    }
});

// Método para marcar como leída
NotificacionSchema.methods.marcarComoLeida = function() {
    this.leida = true;
    this.fecha_lectura = new Date();
    return this.save();
};

// Método para obtener datos públicos
NotificacionSchema.methods.obtenerDatosPublicos = function() {
    return {
        notificacion_id: this.notificacion_id,
        tipo: this.tipo,
        titulo: this.titulo,
        mensaje: this.mensaje,
        leida: this.leida,
        fecha_creacion: this.fecha_creacion,
        fecha_lectura: this.fecha_lectura
    };
};

// Middleware para generar ID automáticamente
NotificacionSchema.pre('save', function(next) {
    if (!this.notificacion_id) {
        const timestamp = Date.now().toString();
        const random = Math.random().toString(36).substr(2, 5);
        this.notificacion_id = `NOT${timestamp}${random}`.toUpperCase();
    }
    next();
});

module.exports = mongoose.model('Notificacion', NotificacionSchema);