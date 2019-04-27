var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var assetSchema = new Schema({
    symbol : String,
    name : String,
    taxonomy : String,
    settlement : String
}, { collection : 'asset' });

const ParetoAsset = mongoose.model('asset', assetSchema);

module.exports = ParetoAsset;