from flask import Flask
from flask_cors import CORS

def create_app():
    app = Flask(__name__)
    CORS(app)

    from app.routes.predict import predict_bp
    from app.routes.graph_predict import graph_bp
    app.register_blueprint(predict_bp, url_prefix='')
    app.register_blueprint(graph_bp, url_prefix='')

    @app.route('/health')
    def health():
        return {'status': 'ok', 'service': 'fraud-ml-service'}

    return app
