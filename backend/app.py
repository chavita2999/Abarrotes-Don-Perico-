from flask import Flask, jsonify
import mysql.connector

app = Flask(__name__)

@app.route('/empleados')
def empleados():
    conn = mysql.connector.connect(
        host='localhost', user='root', password='admin', database='checador_don_perico'
    )
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT nombre, puesto, correo, PagoxHora FROM empleados")
    empleados = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(empleados)

if __name__ == '__main__':
    app.run(debug=True)

from flask import Flask, jsonify
import mysql.connector

app = Flask(__name__)

@app.route('/empleados')
def empleados():
    conn = mysql.connector.connect(
        host='localhost', user='root', password='TU_PASSWORD', database='TU_BASE'
    )
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT nombre, puesto, correo, PagoxHora FROM empleados")
    empleados = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(empleados)

if __name__ == '__main__':
    app.run(debug=True)    