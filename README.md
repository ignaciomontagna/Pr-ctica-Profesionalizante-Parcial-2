🛒 El Mejor Negocio de Computación (E-Commerce)

Este repositorio contiene el código fuente de una plataforma de comercio electrónico de componentes informáticos, desarrollada como parte del Segundo Parcial de la materia Práctica Profesionalizante I.

🎓 Contexto Académico

Institución: IES N° 9-008 Manuel Belgrano

Carrera: Tecnicatura Superior en Desarrollo de Software

Materia: Práctica Profesionalizante I

Docente: Juan Caballero Gallar

Integrantes del Equipo: Ignacio Montagna Lilloy, Ivo Gonzalez, Facundo Saenz y Federico Calafiore

🚀 Características Principales

El sistema es una aplicación web dinámica que incluye las siguientes funcionalidades:

Catálogo de Productos: Visualización de componentes (monitores, gabinetes, placas de video, fuentes) con filtrado dinámico.

Autenticación de Usuarios: Sistema de Registro e Inicio de Sesión seguro con encriptación de contraseñas (Hash) y validación de seguridad (CAPTCHA).

Gestión de Sesiones: Manejo de sesiones de usuario nativas mediante Flask.

Carrito de Compras: Selección de productos, cálculo de totales y procesamiento de pedidos conectados a la base de datos.

Diseño Responsivo: Interfaz gráfica completamente personalizada y adaptable a distintos dispositivos utilizando HTML5 y CSS3 puro.

🛠️ Tecnologías Utilizadas

Backend: Python, Flask, Jinja2, Werkzeug (Seguridad).

Frontend: HTML5, CSS3, JavaScript (Vanilla).

Base de Datos: MySQL (conector nativo).

⚙️ Instalación y Ejecución Local

Para correr este proyecto en tu entorno local, sigue estos pasos:

1. Clonar el repositorio

git clone https://github.com/ignaciomontagna/Pr-ctica-Profesionalizante-Parcial-2.git
cd Pr-ctica-Profesionalizante-Parcial-2/mi_proyecto


2. Configurar la Base de Datos

Asegúrate de tener un servidor MySQL en ejecución (ej. XAMPP, WAMP, o MySQL Server local).

Importa el archivo database.sql incluido en el proyecto para generar las tablas usuarios, productos y pedidos con sus respectivos datos de prueba.

Si es necesario, actualiza las credenciales de conexión (usuario/contraseña) dentro del archivo de configuración o en app.py.

3. Crear entorno virtual e instalar dependencias

Es altamente recomendable utilizar un entorno virtual (venv):

python -m venv venv
# Activar entorno en Windows:
venv\Scripts\activate
# Activar entorno en Mac/Linux:
source venv/bin/activate

# Instalar los requerimientos de Flask
pip install -r requirements.txt


4. Ejecutar la aplicación

Una vez configurado todo, levanta el servidor de desarrollo de Flask:

python app.py


La aplicación estará disponible en tu navegador en: http://127.0.0.1:5000

Desarrollado con dedicación para la Práctica Profesionalizante 2026.
