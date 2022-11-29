const express = require('express')
const app = express()
const path = require('path');
const MTProto = require('@mtproto/core');
const { sleep } = require('@mtproto/core/src/utils/common');


MtProtoParams = {
  api_id: 2496,
  api_hash: '8da85b0d5bfe62527e5b244c209159c3',
  storageOptions: {
    path: path.resolve(__dirname, './data/'+ (Math.random()*(25000-20+1)+20).toString().split(".")[0] +'.json'),
  }
}

var api = new MTProto(MtProtoParams);

module.exports = api;

ResponseResult = {
  "Ban":"ban",
  "OK" : "true",
  "Flood" : "flood"
}


api.call('help.getConfig').then(result => {
  console.log(result);
});

let HasFlood = false;
let IsTest = false;
async function InvokePhonenumber(pn){
  let result = ""
  console.log("ENTERED PHONENUMBER : ",pn)
  try{
    const _result = await api.call('auth.sendCode', {
      phone_number: pn,
      settings: {
        _ : 'codeSettings',
      },
    });
    console.log(pn + " true");
    result = ResponseResult.OK;
  }
  catch(error){
    console.log(error)
    if(error.error_message.startsWith('PHONE_MIGRATE')){
      const [type, dcIdAsString] = error.error_message.split("_MIGRATE_");
      const dcId = Number(dcIdAsString);
      await api.setDefaultDc(dcId);
      return await InvokePhonenumber(pn)
    }
    if(error.error_message.startsWith('FLOOD_WAIT')){
      result = ResponseResult.Flood
    }
    switch(error.error_message){
      case "PHONE_NUMBER_FLOOD":
        result=ResponseResult.Flood;
        console.log(pn + " flood");
        break;
      case "PHONE_NUMBER_BANNED":
        console.log(pn + " ban");
        result=ResponseResult.Ban;
        break;
      case 'PHONE_NUMBER_INVALID':
        console.log(pn + " INVALID");
        result=ResponseResult.Ban;
        break;
      default:
        result = ResponseResult.Ban;
        break;
    }
  }
  console.log(pn, result)
  return result;
}

app.post('/check', async (req, res) => {
  const Phonenumber = req.headers.phone.startsWith('+') ? req.headers.phone : "+" + req.headers.phone;
  let result = await InvokePhonenumber(Phonenumber);
  res.send(result);
  return;
});

var port = 80;

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
