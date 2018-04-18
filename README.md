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
