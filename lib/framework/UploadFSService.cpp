#include <DiagnosticsService.h>
#include <UploadFSService.h>

UploadFSService::UploadFSService(AsyncWebServer *server,
                                 SecurityManager *securityManager)
    : _securityManager(securityManager) {
  server->on(
      UPLOAD_FS_PATH, HTTP_POST,
      std::bind(&UploadFSService::uploadComplete, this, std::placeholders::_1),
      std::bind(&UploadFSService::handleUpload, this, std::placeholders::_1,
                std::placeholders::_2, std::placeholders::_3,
                std::placeholders::_4, std::placeholders::_5,
                std::placeholders::_6));
#ifdef ESP8266
  Update.runAsync(true);
#endif
}

void UploadFSService::handleUpload(AsyncWebServerRequest *request,
                                   const String &filename, size_t index,
                                   uint8_t *data, size_t len, bool final) {
  if (!index) {
    Authentication authentication =
        _securityManager->authenticateRequest(request);
    if (AuthenticationPredicates::IS_ADMIN(authentication)) {
#ifdef ESP8266
      size_t fsSize = ((size_t)FS_end - (size_t)FS_start);
      close_all_fs();
#else
      size_t fsSize = UPDATE_SIZE_UNKNOWN;
      LittleFS.end();
#endif
      DiagnosticsService::log("UploadFS: Flasheando %s (%u bytes)",
                              filename.c_str(), (unsigned)fsSize);

      if (Update.begin(fsSize, FS_UPDATE_CMD)) {
        request->onDisconnect(UploadFSService::handleEarlyDisconnect);
      } else {
        DiagnosticsService::log("UploadFS: Error begin");
        handleError(request, 500);
      }
    } else {
      handleError(request, 403);
    }
  }

  if (!request->_tempObject) {
    if (Update.write(data, len) != len) {
      DiagnosticsService::log("UploadFS: Error write");
      handleError(request, 500);
    }
    if (final) {
      if (!Update.end(true)) {
        DiagnosticsService::log("UploadFS: Error end");
        handleError(request, 500);
      } else {
        DiagnosticsService::log("UploadFS: Grabado OK en LittleFS");
      }
    }
  }
}

void UploadFSService::uploadComplete(AsyncWebServerRequest *request) {
  if (!request->_tempObject) {
    request->onDisconnect(RestartService::restartNow);
    AsyncWebServerResponse *response = request->beginResponse(200);
    request->send(response);
  }
}

void UploadFSService::handleError(AsyncWebServerRequest *request, int code) {
  if (request->_tempObject) {
    return;
  }
  request->_tempObject = new int(code);
  Update.printError(Serial);
  AsyncWebServerResponse *response = request->beginResponse(code);
  request->send(response);
}

void UploadFSService::handleEarlyDisconnect() { Update.end(); }
