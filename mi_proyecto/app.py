import os
import io
import random
import string
import pymysql
from flask import Flask, render_template, request, redirect, url_for, flash, session, send_file, jsonify
from flask_wtf import FlaskForm, CSRFProtect
from wtforms import StringField, PasswordField, SubmitField
from wtforms.validators import DataRequired, Email, Length
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from werkzeug.security import generate_password_hash, check_password_hash
from captcha.image import ImageCaptcha

import config

app = Flask(__name__)
app.config['SECRET_KEY'] = os.urandom(24)

# Protección CSRF (Funcional 33%)
csrf = CSRFProtect(app)

# Limitador contra Fuerza Bruta (Funcional 33%)
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://"
)

# Conexión a MySQL con PyMySQL y consultas preparadas (Básico 33%)
def get_db_connection():
    return pymysql.connect(
        host=config.MYSQL_HOST,
        user=config.MYSQL_USER,
        password=config.MYSQL_PASSWORD,
        database=config.MYSQL_DB,
        port=config.MYSQL_PORT,
        cursorclass=pymysql.cursors.DictCursor
    )

# Formularios
class RegistrationForm(FlaskForm):
    nombre = StringField('Nombre', validators=[DataRequired(), Length(min=2, max=100)])
    email = StringField('Email', validators=[DataRequired(), Email()])
    password = PasswordField('Contraseña', validators=[DataRequired(), Length(min=8)])
    captcha = StringField('CAPTCHA', validators=[DataRequired()])
    submit = SubmitField('Registrar')

class LoginForm(FlaskForm):
    email = StringField('Email', validators=[DataRequired(), Email()])
    password = PasswordField('Contraseña', validators=[DataRequired()])
    captcha = StringField('CAPTCHA', validators=[DataRequired()])
    submit = SubmitField('Iniciar Sesión')

# Generador de CAPTCHA (Completo 33%)
@app.route('/captcha-image')
def captcha_image():
    image = ImageCaptcha(width=160, height=60)
    captcha_text = ''.join(random.choices(string.ascii_uppercase + string.digits, k=5))
    session['captcha_text'] = captcha_text
    data = image.generate(captcha_text)
    return send_file(io.BytesIO(data.getvalue()), mimetype='image/png')

# Encabezados de Seguridad (Funcional 33%)
@app.after_request
def set_security_headers(response):
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['Content-Security-Policy'] = "default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;"
    return response

# Rutas principales
@app.route('/')
def index():
    return render_template('pag_pp.html')

@app.route('/registro', methods=['GET', 'POST'])
def registro():
    form = RegistrationForm()
    if form.validate_on_submit():
        user_captcha = form.captcha.data.strip().upper()
        if user_captcha != session.get('captcha_text', ''):
            flash('Código CAPTCHA incorrecto. Inténtalo de nuevo.', 'danger')
            return render_template('registro.html', form=form)

        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:
                # Consulta preparada (Básico 33%)
                sql_check = "SELECT id FROM usuarios WHERE email = %s"
                cursor.execute(sql_check, (form.email.data,))
                if cursor.fetchone():
                    flash('El correo ya está registrado.', 'danger')
                    return render_template('registro.html', form=form)

                sql_insert = "INSERT INTO usuarios (nombre, email, password_hash) VALUES (%s, %s, %s)"
                hashed_pw = generate_password_hash(form.password.data)
                cursor.execute(sql_insert, (form.nombre.data, form.email.data, hashed_pw))
                conn.commit()
                flash('Registro exitoso. Ya puedes iniciar sesión.', 'success')
                return redirect(url_for('login'))
        finally:
            conn.close()

    return render_template('registro.html', form=form)

@app.route('/login', methods=['GET', 'POST'])
@limiter.limit("5 per minute")
def login():
    form = LoginForm()
    if form.validate_on_submit():
        user_captcha = form.captcha.data.strip().upper()
        if user_captcha != session.get('captcha_text', ''):
            flash('Código CAPTCHA incorrecto. Inténtalo de nuevo.', 'danger')
            return render_template('login.html', form=form)

        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:
                # Consulta preparada (Básico 33%)
                sql = "SELECT * FROM usuarios WHERE email = %s"
                cursor.execute(sql, (form.email.data,))
                user = cursor.fetchone()

                if user and check_password_hash(user['password_hash'], form.password.data):
                    session['user_id'] = user['id']
                    session['user_name'] = user['nombre']
                    flash('¡Bienvenido!', 'success')
                    return redirect(url_for('index'))
                else:
                    flash('Credenciales incorrectas.', 'danger')
        finally:
            conn.close()

    return render_template('login.html', form=form)

@app.route('/crear-pedido', methods=['POST'])
def crear_pedido():
    if 'user_id' not in session:
        return jsonify({'status': 'error', 'message': 'Debes iniciar sesión para comprar.'}), 401

    data = request.get_json()
    id_producto = data.get('id_producto')
    cantidad = data.get('cantidad')

    if not id_producto or not cantidad:
        return jsonify({'status': 'error', 'message': 'Datos incompletos.'}), 400

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            sql_pedido = """
                INSERT INTO pedidos (id_usuario, id_producto, cantidad, estado)
                VALUES (%s, %s, %s, 'completado')
            """
            cursor.execute(sql_pedido, (session['user_id'], id_producto, cantidad))
            
            sql_stock = "UPDATE productos SET stock = stock - %s WHERE id = %s AND stock >= %s"
            cursor.execute(sql_stock, (cantidad, id_producto, cantidad))
            
            conn.commit()
            return jsonify({'status': 'success', 'message': 'Pedido registrado correctamente.'})
    except Exception as e:
        conn.rollback()
        return jsonify({'status': 'error', 'message': 'Error al procesar el pedido.'}), 500
    finally:
        conn.close()

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('index'))

if __name__ == '__main__':
    app.run(debug=True)