const UserRouter = require('./UserRouter')
const ProductRouter = require('./ProductRouter')
const OrderRouter = require('./OrderRouter')
const ReportRouter = require('./ReportRouter')
const ReviewRouter = require('./ReviewRouter')

const routes = (app) => {
    app.use('/api/user', UserRouter)
    app.use('/api/product', ProductRouter)
    app.use('/api/order', OrderRouter)
    app.use('/api/report', ReportRouter)
    app.use('/api/review', ReviewRouter) 
}

module.exports = routes