FROM python:3.10

# Crear usuario que ejecuta la app
RUN adduser --disabled-password --gecos '' api-user

# Definir directorio de trabajo 
WORKDIR /opt/dropout-api

# Instalar dependencias
ADD ./api /opt/dropout-api/
RUN pip install --upgrade pip
RUN pip install -r /opt/dropout-api/requirements.txt

# Hacer el directorio de trabajo ejecutable 
RUN chmod +x /opt/dropout-api/run.sh
# Cambiar propiedad de la carpeta a api-user 
RUN chown -R api-user:api-user ./

USER api-user
# Puerto a exponer para la api 
EXPOSE 8001

# Comandos a ejecutar al correr el contenedor 
CMD ["bash", "./run.sh"]
