import os

from setuptools import setup


setup(
    name="dropout_model_artifact",
    version=os.getenv("WHEEL_VERSION", "0.1.0"),
    description="Installable artifact package for dropout modelo_final",
    packages=["dropout_model_artifact"],
    include_package_data=True,
    package_data={"dropout_model_artifact": ["model/*"]},
)
