function mirrorScriptFiles(scriptSource,scriptDestination,keepFileNames) {
  var AUTH = JSON.parse(AUTH_PACKAGE)
  OAuth2.EzyOauth2(AUTH);
  
  
  if (!keepFileNames) keepFileNames = []; //array of filenames NOT to update, i.e. ["configuration.gs"];
  

  //get file data
  var sourceFile = Drive.Files.get(scriptSource);
  var destFile = Drive.Files.get(scriptDestination);
  
  var surl = sourceFile.exportLinks["application/vnd.google-apps.script+json"];
  var durl = destFile.exportLinks["application/vnd.google-apps.script+json"];
  
  var oauthToken = ScriptApp.getOAuthToken();
  
  //export file via URL call, then parse the JSON
  var sourceFilejson_data = JSON.parse(UrlFetchApp.fetch(surl, {
    headers: {
      'Authorization': 'Bearer ' + oauthToken
    }
  }).getContentText());
  
  var destFilejson_data = JSON.parse(UrlFetchApp.fetch(durl, {
    headers: {
      'Authorization': 'Bearer ' + oauthToken
    }
  }).getContentText());
  
  var newFile = {files:[]};
  
  var workingObject = { source:{}, dest:{}};
  
  for (var i = 0; i<destFilejson_data.files.length;i++) {
    var fname = destFilejson_data.files[i].name;
    workingObject.dest[fname]=destFilejson_data.files[i];
  }
  
  for (var i = 0; i<sourceFilejson_data.files.length; i++) {
    var fname = sourceFilejson_data.files[i].name;
    workingObject.source[fname]=sourceFilejson_data.files[i];
  }
  
  
  //CREATE UPDATE JSON
  //we need to keep the ID's in the destination file, so we only want to update source.
  //this part of the code updates name and type too, which does not matter for existing files but is needed if a file is added
   for (var key in workingObject.source) {
    
    if (keepFileNames.indexOf(key)==-1 || !workingObject.dest[key]) { //if the file does not exist AND is not in keepFileNames, update the file
      if (!workingObject.dest[key]) workingObject.dest[key] = {};
      workingObject.dest[key].name = workingObject.source[key].name;
      workingObject.dest[key].source = workingObject.source[key].source;
      workingObject.dest[key].type = workingObject.source[key].type;
    }
     
  }
  
  //delete files (not sure if I want to)
  
  
  var files = [];
  for (var key in workingObject.dest) {
    files.push(workingObject.dest[key])
  }
  
  
  
  //WORKS!
  var url = "https://www.googleapis.com/upload/drive/v2/files/"+scriptDestination //convert=true"
  
  
  var options = { 
    contentType: "application/vnd.google-apps.script+json",
    payload:  JSON.stringify({files:files}),
    method: "PUT",
    headers: { Authorization: "Bearer "+AUTH.access.accessToken }
  }
  
  var response = UrlFetchApp.fetch(url,options);
  var q = response.getContentText();
  
  var code = response.getResponseCode();
  switch (code) {
    case 200:
      return response.getContentText();
      break;
    default:
      throw "Error "+code+": "+response
      
      break;
      
  }
  
}



