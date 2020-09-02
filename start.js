import Server from './config/server';
import MockerService from './app/services/mockerService';
import Environment from './config/environment';

const port = process.env.PORT || 3000;

const environment = new Environment();
const server = new Server();
const service = new MockerService(environment);
const app = server.prepareApp();

let serverUp = false;

service.initializeCollections()
.then((result) => {
    if (result && result.success) {
        console.log(result);
        serverUp = true;
    } else {
        console.log('Server down');
    }
})
.catch(err => console.log(err))
.finally(() => {
    if (serverUp) {
        app.listen(port, () => {
            console.log(`Server vesion ${process.env.npm_package_version} up listening on port ${port}`);
        });
    }
});
