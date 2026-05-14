package com.hayaledd.scriptflow;

import android.graphics.Color;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    // Make WebView background transparent so CameraPreview (toBack:true) shows through
    getBridge().getWebView().setBackgroundColor(Color.TRANSPARENT);
  }
}
