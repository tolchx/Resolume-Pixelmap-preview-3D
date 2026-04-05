@echo off
echo Iniciando servidor local para Resolume Pixelmap preview 3D...
start http://localhost:8000/
python -m http.server 8000
