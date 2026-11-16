# BottleSafe · Inspección de botellas

Prototipo universitario en Next.js con App Router y JavaScript. Abre fotos o
usa **Encender cámara** para ver la imagen en vivo. Encuadra la botella y pulsa **Iniciar detección**. Puedes pausar YOLO mientras la cámara sigue mostrando la imagen. La inferencia de
YOLO11n se ejecuta en el navegador con ONNX Runtime Web. Las imágenes de la
cámara y los archivos elegidos permanecen en el dispositivo.

## Ejecutar en local

Usa Node.js 20.9 o posterior. Desde la carpeta del proyecto:

```bash
npm ci
npm run dev
```

Abre http://localhost:3000. La cámara necesita un contexto seguro. Para abrir
la cámara desde el celular, usa el enlace del despliegue por HTTPS.

## Compilar

```bash
npm run build
```

La compilación genera `out/` para alojamiento estático. La instalación copia
los binarios de ejecución a `public/ort/`. Los pesos del piloto están en
`public/modelo/botellas_piloto_v3.onnx`, y `lib/yolo.js` prepara cada
fotograma en escala de grises, ejecuta el modelo y devuelve sus recuadros.

La confianza mínima inicial es 25 %. Una pantalla sin detecciones no certifica
que la botella esté intacta. El modelo v3 se ajustó con 30 fotos. En cuatro tomas reservadas de la última tanda, la v3 localizó 5 de 5 perforaciones anotadas frente a 3 de 5 con v2. Ambas versiones dieron cero falsas alarmas en las dos tomas intactas de esa prueba. El umbral de confianza fue 25 % y el mínimo de superposición de cajas (IoU) fue 0,50. Las tomas reservadas muestran botellas del proyecto en otros ángulos. Las vistas perforadas de la galería se usaron en el ajuste. La botella intacta de la galería se reservó para probar falsas alarmas.

## Mapa de perforaciones

La botella animada representa aproximadamente el lado visible. Los puntos
corresponden al centro de los recuadros de YOLO. En **Fotos y resultados**,
selecciona un punto para resaltar su recuadro y usa **Ajustar encuadre de la
botella** para alinear la proyección con los bordes de la botella en la foto.
