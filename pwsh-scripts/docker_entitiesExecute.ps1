# carrito.json
docker cp data/carrito.json elbaul_db_dev:/docker-entrypoint-initdb.d/
docker exec elbaul_db_dev mongoimport --db elbaul_db --collection carritos --file /docker-entrypoint-initdb.d/carrito.json --jsonArray

# categoria.json
docker cp data/categoria.json elbaul_db_dev:/docker-entrypoint-initdb.d/
docker exec elbaul_db_dev mongoimport --db elbaul_db --collection categorias --file /docker-entrypoint-initdb.d/categoria.json --jsonArray

# comentarios.json
docker cp data/comentarios.json elbaul_db_dev:/docker-entrypoint-initdb.d/
docker exec elbaul_db_dev mongoimport --db elbaul_db --collection comentarios --file /docker-entrypoint-initdb.d/comentarios.json --jsonArray

# cupon_descuento.json
docker cp data/cupon_descuento.json elbaul_db_dev:/docker-entrypoint-initdb.d/
docker exec elbaul_db_dev mongoimport --db elbaul_db --collection cupones_descuento --file /docker-entrypoint-initdb.d/cupon_descuento.json --jsonArray

# devolucion.json
docker cp data/devolucion.json elbaul_db_dev:/docker-entrypoint-initdb.d/
docker exec elbaul_db_dev mongoimport --db elbaul_db --collection devoluciones --file /docker-entrypoint-initdb.d/devolucion.json --jsonArray

# envio.json
docker cp data/envio.json elbaul_db_dev:/docker-entrypoint-initdb.d/
docker exec elbaul_db_dev mongoimport --db elbaul_db --collection envios --file /docker-entrypoint-initdb.d/envio.json --jsonArray

# favorito.json
docker cp data/favorito.json elbaul_db_dev:/docker-entrypoint-initdb.d/
docker exec elbaul_db_dev mongoimport --db elbaul_db --collection favoritos --file /docker-entrypoint-initdb.d/favorito.json --jsonArray

# imagen_producto.json
docker cp data/imagen_producto.json elbaul_db_dev:/docker-entrypoint-initdb.d/
docker exec elbaul_db_dev mongoimport --db elbaul_db --collection imagenes_producto --file /docker-entrypoint-initdb.d/imagen_producto.json --jsonArray

# inventario.json
docker cp data/inventario.json elbaul_db_dev:/docker-entrypoint-initdb.d/
docker exec elbaul_db_dev mongoimport --db elbaul_db --collection inventarios --file /docker-entrypoint-initdb.d/inventario.json --jsonArray

# item_carrito.json
docker cp data/item_carrito.json elbaul_db_dev:/docker-entrypoint-initdb.d/
docker exec elbaul_db_dev mongoimport --db elbaul_db --collection items_carrito --file /docker-entrypoint-initdb.d/item_carrito.json --jsonArray

# item_orden.json
docker cp data/item_orden.json elbaul_db_dev:/docker-entrypoint-initdb.d/
docker exec elbaul_db_dev mongoimport --db elbaul_db --collection items_orden --file /docker-entrypoint-initdb.d/item_orden.json --jsonArray

# notificaciones.json
docker cp data/notificaciones.json elbaul_db_dev:/docker-entrypoint-initdb.d/
docker exec elbaul_db_dev mongoimport --db elbaul_db --collection notificaciones --file /docker-entrypoint-initdb.d/notificaciones.json --jsonArray

# orden.json
docker cp data/orden.json elbaul_db_dev:/docker-entrypoint-initdb.d/
docker exec elbaul_db_dev mongoimport --db elbaul_db --collection ordenes --file /docker-entrypoint-initdb.d/orden.json --jsonArray

# pago.json
docker cp data/pago.json elbaul_db_dev:/docker-entrypoint-initdb.d/
docker exec elbaul_db_dev mongoimport --db elbaul_db --collection pagos --file /docker-entrypoint-initdb.d/pago.json --jsonArray

# producto.json
docker cp data/producto.json elbaul_db_dev:/docker-entrypoint-initdb.d/
docker exec elbaul_db_dev mongoimport --db elbaul_db --collection productos --file /docker-entrypoint-initdb.d/producto.json --jsonArray

# publicaciones.json
docker cp data/publicaciones.json elbaul_db_dev:/docker-entrypoint-initdb.d/
docker exec elbaul_db_dev mongoimport --db elbaul_db --collection publicaciones --file /docker-entrypoint-initdb.d/publicaciones.json --jsonArray

# reacciones.json
docker cp data/reacciones.json elbaul_db_dev:/docker-entrypoint-initdb.d/
docker exec elbaul_db_dev mongoimport --db elbaul_db --collection reacciones --file /docker-entrypoint-initdb.d/reacciones.json --jsonArray

# resena.json
docker cp data/resena.json elbaul_db_dev:/docker-entrypoint-initdb.d/
docker exec elbaul_db_dev mongoimport --db elbaul_db --collection resenas --file /docker-entrypoint-initdb.d/resena.json --jsonArray

# temas.json
docker cp data/temas.json elbaul_db_dev:/docker-entrypoint-initdb.d/
docker exec elbaul_db_dev mongoimport --db elbaul_db --collection temas --file /docker-entrypoint-initdb.d/temas.json --jsonArray

# usuarios.json
docker cp data/usuarios.json elbaul_db_dev:/docker-entrypoint-initdb.d/
docker exec elbaul_db_dev mongoimport --db elbaul_db --collection usuarios --file /docker-entrypoint-initdb.d/usuarios.json --jsonArray
