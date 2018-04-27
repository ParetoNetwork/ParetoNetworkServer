# Pareto Network Server

Frontand and Backend for calculating ranking and all other functions of the Pareto Network intel feed.

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

Authenticated routes include:

GET   /v1/auth

GET   /v1/splash-auth

POST  /v1/unsign

GET   /v1/summation

GET   /v1/content

POST  /v1/content



## DEVELOPMENT SETUP

- Install the latest Docker version.
- The file _docker-compose.yml_  will have all the configuration to deploy _Redis_ and _Mongo_ into your development environment, it will also execute a migration to import a backup  into your _Mongo_ instance with the collections required for this project to run.
- Before running the _Node.js_ application run: *docker-compose up*
- Finally, the following configuration ass environment variables:
    -  For _Mongo_ the docker container will expose port *27018* so update *MONGODB_URI* properly to point to your local instance like this: *mongodb://localhost:27018/pareto*
    -  For _Redis_ the docker container will export port  *27017* so you will need to add the following enviroment variabled: *REDIS_HOST* with value *localhost* and *REDIS_PORT* with value *27017*
- if the configuration is successful you should see something like this on your console after you run the *Node.js* app:

```
PARETO: Success connecting to Redis
PARETO: Success connecting to Mongo 
Pareto Network ranking app listening on port 3000!
```