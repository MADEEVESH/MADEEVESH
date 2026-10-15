package live.stormbreaker.servicesite;

import android.os.Bundle;
import android.webkit.WebView;
import androidx.webkit.WebViewCompat;
import androidx.webkit.WebViewFeature;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.WebViewListener;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.util.Set;

public class MainActivity extends BridgeActivity {
    private String policyScript = "";
    private boolean documentStartInstalled;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(StorePolicyPlugin.class);
        policyScript = loadPolicyScript();
        bridgeBuilder.addWebViewListener(
            new WebViewListener() {
                @Override
                public void onPageStarted(WebView webView) {
                    injectPolicy(webView);
                }

                @Override
                public void onPageLoaded(WebView webView) {
                    injectPolicy(webView);
                }
            }
        );
        super.onCreate(savedInstanceState);
    }

    @Override
    public void onStart() {
        super.onStart();
        installDocumentStartScript();
    }

    private void installDocumentStartScript() {
        if (documentStartInstalled || bridge == null || policyScript.isEmpty()) {
            return;
        }
        WebView webView = bridge.getWebView();
        if (webView == null || !WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT)) {
            return;
        }
        Set<String> origins = new HashSet<>();
        origins.add("https://stormbreaker.live");
        origins.add("https://*.stormbreaker.live");
        WebViewCompat.addDocumentStartJavaScript(webView, policyScript, origins);
        documentStartInstalled = true;
    }

    private void injectPolicy(WebView webView) {
        if (webView == null || policyScript.isEmpty()) {
            return;
        }
        webView.evaluateJavascript(policyScript, null);
    }

    private String loadPolicyScript() {
        try (InputStream in = getAssets().open("public/plan-policy.js")) {
            ByteArrayOutputStream buffer = new ByteArrayOutputStream();
            byte[] data = new byte[4096];
            int read;
            while ((read = in.read(data)) != -1) {
                buffer.write(data, 0, read);
            }
            return buffer.toString(StandardCharsets.UTF_8.name());
        } catch (IOException ex) {
            return "";
        }
    }
}
