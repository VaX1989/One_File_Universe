// Wave IV founder-interaction compatibility gate for the shipping v1 foreground.
//
// The v1.0.0 product replaced the historical #wave-iv-macro-view / #planet-view
// foreground with the Living Product runtime.  The release oracle must therefore
// exercise the actual user-visible renderer instead of requiring a retired hidden
// DOM/backend.  Reuse the definitive v1 founder journey so this historical gate
// retains (and strengthens) its interaction, touch, navigation, rendering,
// persistence, responsive-layout, offline and error-free requirements.

process.env.BROWSER = process.env.BROWSER || 'chromium';
await import('../v1/browser-v1-product.mjs');
