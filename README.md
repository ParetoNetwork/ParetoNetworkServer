# Pareto Network Server

Frontend and Backend for calculating ranking and all other functions of the Pareto Network intel feed.

This implements two parts of the ranking algorithm so far, and can do a client side calculation first primarily for cosmetic purposes.

There are only several views:

The splash view - intended to be straight to the point with a clear call to action.

The about view - goes into more detail about what the Pareto Network is and who is behind it

The dashboard - the product, where users can view the stream of intel that they are privy to see

The rank - shows the user their current score and ranking within the Pareto system.

## API

Unauthenticated routes include:

POST  /v1/sign

GET   /v1/rank


## DEVELOPMENT SETUP

To start backend Service follow the next steps:

- Install the latest Docker version.
- The file _docker-compose.yml_  will have all the configuration to deploy _Redis_ and _Mongo_ into your development environment, it will also execute a migration to import a backup  into your _Mongo_ instance with the collections required for this project to run.
- Before running the _Node.js_ application run: *docker-compose up*
- Finally, the following configuration ass environment variables:
    -  For _Mongo_ the docker container will expose port *27018* so update *MONGODB_URI* properly to point to your local instance like this: *mongodb://localhost:27018/pareto*
    -  For _Redis_ the docker container will export port  *27017* so you will need to add the following enviroment variable: *REDIS_URL* with the full connection URL to *Redis* like this: *redis://localhost:27019*
    -  For Frontend Application communication, the environment variable *FRONTEND_SERVER* must be inicializated in *http://localhost:8080*
- if the configuration is successful you should see something like this on your console after you run the *Node.js* app:

```
PARETO: Success connecting to Redis
PARETO: Success connecting to Mongo 
Pareto Network ranking app listening on port 3000!
```
To start frontEnd application follow the next steps:
- start backend Service
- install dependencies if are not installed (inside /frontend folder execute in terminal: *npm i*)
- run application executing in terminal  *npm run-script --prefix frontend serve*  on root project folder; or execute *npm run-script serve* inside /frontend folder

## UNIT TEST SETUP

To start unitTest follow the next steps:
- make sure that all dependecies are installed (docker, package.json in root project folder, package.json in /frondtend folder)
- install vue unit test dependencies with
    - vue add @vue/unit-mocha   (inside /frontend folder)
- Before running the test application run: *docker-compose up*
- create a file in /test/ and named mocha.env.js
- inside the /test/mocha.env.js create the environment variables according DEVELOPMENT SETUP. The variable *SIGN* must be contain in json string the return data from MetaMask of the user to be tested:
    - process.env.REDIS_URL
    - process.env.MONGODB_URI
    - process.env.FRONTEND_SERVER
    - process.env.SIGN
    - process.env.CRED_MONGODB
    - process.env.CRED_PARETOCONTRACT
    - process.env.SPECTED_SCORE
    - process.env.SPECTED_PRECISION
- Execute unit_test backend  *npm run-script test --  --opts ./mocha.opts*
- Execute unit_test frontend  *npm run-script --prefix frontend test:unit*
