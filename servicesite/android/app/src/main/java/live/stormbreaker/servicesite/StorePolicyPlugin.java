package live.stormbreaker.servicesite;

import android.net.Uri;
import com.getcapacitor.Plugin;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.Locale;

/**
 * Stops the WebView from opening a subscription checkout. Plan sales stay on
 * the website, which is what Play requires for this app.
 */
@CapacitorPlugin(name = "StorePolicy")
public class StorePolicyPlugin extends Plugin {
    @Override
    public Boolean shouldOverrideLoad(Uri url) {
        if (url == null) {
            return null;
        }
        if (isBillingHost(url.getHost())) {
            return true;
        }
        return null;
    }

    private static boolean isBillingHost(String host) {
        if (host == null) {
            return false;
        }
        String value = host.toLowerCase(Locale.US);
        return value.equals("paddle.com") || value.endsWith(".paddle.com") || value.equals("paddle.io") || value.endsWith(".paddle.io");
    }
}
