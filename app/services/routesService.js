import MongoConnection from '../../config/mongo';

/**
 * Methods Class
 */
export class Methods { }
/**
 * Get verb
 */
Methods.get = 'get';
/**
 * Post verb
 */
Methods.post = 'post';
/**
 * Put verb
 */
Methods.put = 'put';
/**
 * Delete verb
 */
Methods.delete = 'delete';

/**
 * RouteService class
 */
export default class RouteService {

    /**
     * Inicialize new instance of RouteService
     * @param {MongoConnection} mongo 
     */
    constructor(mongo = new MongoConnection()) {
        this.mongo = mongo;
    }

    getAllRoutes() {
        return this.mongo.select(this.mongo.DataBaseName, this.mongo.RouteCollectionName);
    }

    /**
     * Get Routes by methods
     * @param {Methods} withMethod Set method filter
     */
    getRoutes(withMethod = Methods) {
        const projection = {
            'route': 1, 
            'method': 1
        };
        const find = {
            'method': {
                '$eq': `${withMethod}`
            }
        };
        return this.mongo.select(this.mongo.DataBaseName, this.mongo.RouteCollectionName, find, projection);
    }

    /**
     * Get Routes by route and method
     * @param {string} route 
     * @param {string} method
     * @param {Object} filter
     */
    getResponse(route, method, filter = {}) {
        let result = {
            statusCode: 304
        };
        const statusException = 500;
        const statusNotFound = 404;
        const statusNotFoundBody = {
            message: `Route not found on collection`
        };
        const find = {
            'route': `${route}`,
            'method': `${method}`
        };
        const projection = {
            '_id': 0
        };

        return new Promise((resolve, reject) => { 
            this.mongo.select(this.mongo.DataBaseName, this.mongo.RouteCollectionName, find, projection)
            .then((route) => {
                if (!route || route.length == 0) {
                    result.statusCode = statusNotFound;
                    result.body = statusNotFoundBody;
                    resolve(result);
                } else {
                    try {
                        const firstRoute = route[0];
                        result.statusCode = firstRoute.expectedStatus;
                        const expectedResponse = firstRoute.request.responses.find(expected => expected.status == result.statusCode);
                        if (expectedResponse.responseCollectionName) {
                            const find = expectedResponse.find || filter;
                            this.getCollection(expectedResponse.responseCollectionName, find, expectedResponse.projection)
                            .then((collectionResult) => {
                                if (collectionResult) {
                                    result.body = collectionResult;
                                } else {
                                    result.body = expectedResponse.body;
                                }
                                resolve(result);
                            })
                            .catch((err) => { 
                                console.log('Request fail');
                                result.statusCode = statusException;
                                result.error = err;
                                reject(result);
                            });
                        } else {
                            result.body = expectedResponse.body;
                            resolve(result);
                        }
                    } catch (error) {
                        console.log(error);
                        result.statusCode = statusException;
                        result.error = error;
                        reject(result);
                    }
                }
            })
            .catch((err) => reject(err));
        });
    }

    /**
     * 
     * @param {string} collectionName Set collection name
     * @param {string} find Set filter
     */
    getCollection(collectionName, find, projection) {
        return this.mongo.select(this.mongo.DataBaseName, collectionName, find, projection);
    }

    /**
     * 
     * @param {string} id Set collection id
     * @param {Object} keyValues Set header keyvalues
     */
    setHeader(id, keyValues) {
        const update = {
            '$set': { 'request.headers': keyValues }
        };
        this.mongo.update(this.mongo.DataBaseName, this.mongo.RouteCollectionName, id, update)
        .catch((err) => console.log(err));
    }

    setQuery(id, keyValues) {
        const update = {
            '$set': { 'request.query': keyValues }
        };
        this.mongo.update(this.mongo.DataBaseName, this.mongo.RouteCollectionName, id, update)
        .catch((err) => console.log(err));
    }

    setBody(id, object) {
        const update = {
            '$set': { 'request.body': object }
        };
        this.mongo.update(this.mongo.DataBaseName, this.mongo.RouteCollectionName, id, update)
        .catch((err) => console.log(err));
    }

}