(() => {
  const $ = selector => document.querySelector(selector);
  const sampleAddress = '0xecb63caa47c7c4e77f60f1ce858cf28dc2b82b00';
  const input = $('#wallet-address'), form = $('#scan-form'), results = $('#scan-results');
  const submit = $('#scan-submit'), sample = $('#scan-sample'), status = $('#scan-status');
  let request = null;
  const valid = address => /^0x[0-9a-f]{40}$/i.test(address);
  const scannerUrl = address => `https://scanner.shieldtx.xyz/${valid(address) ? '#scan/' + encodeURIComponent(address.toLowerCase()) : ''}`;
  const text = (id, value) => { $(id).textContent = value; };
  const finite = value => typeof value === 'number' && Number.isFinite(value);
  const compact = value => finite(value) ? new Intl.NumberFormat('en-US', {notation:'compact', maximumFractionDigits:1}).format(value) : '—';
  const coverageLabel = (value, fallback = 'Unavailable') => ({ready:'Available', complete:'Available', active:'Available', partial:'Partial preview', stale:'Latest available', not_in_dataset:'Not in dataset', unknown:'Unknown'}[value] || fallback);

  function resetRequest() {
    request?.abort(); request = null;
    submit.disabled = false; sample.disabled = false; form.removeAttribute('aria-busy');
    submit.innerHTML = 'Preview wallet exposure <span aria-hidden="true">↗</span>';
  }
  function clearResults() {
    results.hidden = true; status.textContent = ''; $('#scan-error').hidden = true;
    input.removeAttribute('aria-invalid');
    $('#scan-full-link').href = scannerUrl(input.value.trim());
  }
  function resetScanner() {
    resetRequest();
    input.value = '';
    clearResults();
    $('#scan-detail-link').href = scannerUrl('');
    $('#scan-result-address').textContent = '';
    $('#scan-source').textContent = '';
    $('#scan-dialog').scrollTo({top:0,behavior:'instant'});
  }
  const severity = (value, moderateAbove) => value === null ? 'unknown' : value > 70 ? 'high' : value > moderateAbove ? 'moderate' : 'low';
  function tone(id, value) { $(id).setAttribute('data-severity', value); }
  function render(data, address, capturedAt) {
    const coverage = data.coverage || {}, absent = (coverage.scan || data.state) === 'not_in_dataset';
    const score = !absent && finite(data.privacy_score) ? data.privacy_score : null;
    const pressure = !absent && finite(data.copy_exposure) ? data.copy_exposure : null;
    const visibilityTone = severity(score, 40), pressureTone = severity(pressure, 30);
    for (const id of ['#scan-exposure-label','#scan-visibility','#scan-visibility-note','#scan-visibility-meter']) tone(id, visibilityTone);
    for (const id of ['#scan-pressure','#scan-pressure-note','#scan-pressure-meter']) tone(id, pressureTone);
    text('#scan-visibility', score ?? '—'); text('#scan-pressure', pressure ?? '—');
    $('#scan-visibility-meter').style.width = `${Math.max(0, Math.min(100, score ?? 0))}%`;
    $('#scan-pressure-meter').style.width = `${Math.max(0, Math.min(100, pressure ?? 0))}%`;
    text('#scan-visibility-note', score === null ? 'Visibility data is unavailable for this address.' : score > 70 ? 'High visibility to public wallet trackers.' : score > 40 ? 'A measurable public trading footprint.' : 'Lower visibility; activity is still public.');
    text('#scan-pressure-note', pressure === null ? 'Copy-trading coverage is unavailable.' : pressure > 70 ? 'Strong patterns of copy-trading activity.' : pressure > 30 ? 'Notable copy-trading patterns detected.' : 'Some copy-trading patterns; lower relative pressure.');
    text('#scan-copiers', compact(absent ? null : data.copier_count));
    text('#scan-activity', compact(absent ? null : data.recent_activity?.fill_count));
    text('#scan-exposure-label', absent ? 'Not in current dataset' : score === null ? 'Limited coverage' : score > 70 ? 'High exposure' : score > 40 ? 'Moderate exposure' : 'Lower exposure');
    text('#scan-result-address', address);
    text('#scan-copy-status', coverageLabel(absent ? null : coverage.copy));
    text('#scan-position-status', coverageLabel(absent ? null : coverage.positions, 'Unlock in scanner'));
    text('#scan-quality', coverageLabel(absent ? null : coverage.data_quality));
    text('#scan-freshness', absent ? 'Not in dataset' : coverage.stale || data.state === 'stale' ? 'Latest available snapshot' : coverageLabel(coverage.scan || data.state));
    text('#scan-source', capturedAt
      ? `Saved official sample · captured ${new Date(capturedAt).toLocaleDateString('en-GB', {day:'numeric',month:'short',year:'numeric',timeZone:'UTC'})}. Live preview is currently unavailable.`
      : 'Source: ShieldTX public scanner · retrieved just now.');
    text('#scan-data-note', absent ? 'No record in this dataset does not mean that a wallet is private.' : '');
    $('#scan-data-note').hidden = !absent;
    $('#scan-detail-link').href = scannerUrl(address);
    results.hidden = false;
    status.textContent = 'Preview ready. Results are below.';
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) results.animate([{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'translateY(0)'}], {duration:350,easing:'ease-out'});
    $('#scan-results-title').focus({preventScroll:true});
    results.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',block:'start'});
  }
  async function runScan() {
    resetRequest(); clearResults();
    const address = input.value.trim().toLowerCase();
    if (!valid(address)) {
      text('#scan-error', 'Enter a valid public wallet address: 0x followed by 40 hexadecimal characters.');
      $('#scan-error').hidden = false; input.setAttribute('aria-invalid','true'); input.focus(); return;
    }
    const controller = new AbortController(); request = controller;
    const timeout = setTimeout(() => controller.abort('timeout'), 12000);
    submit.disabled = true; sample.disabled = true; form.setAttribute('aria-busy','true');
    submit.textContent = 'Scanning…'; status.textContent = 'Checking ShieldTX’s public scanner…';
    try {
      const response = await fetch(`/api/scanner-preview?address=${encodeURIComponent(address)}`, {headers:{Accept:'application/json'},signal:controller.signal,credentials:'same-origin',cache:'no-store'});
      if (!response.ok) throw new Error('Preview unavailable');
      const data = await response.json();
      if (!data.ok || data.address?.toLowerCase() !== address) throw new Error('Invalid response');
      if (request === controller) render(data, address);
    } catch (error) {
      if (request !== controller) return;
      // A dated, verified sample keeps static/offline previews useful without inventing wallet results.
      if (address === sampleAddress) {
        try {
          const response = await fetch('assets/scanner-sample.json');
          if (!response.ok) throw new Error('Sample unavailable');
          const snapshot = await response.json();
          if (request === controller) render(snapshot.data, address, snapshot.captured_at);
          return;
        } catch (_) { /* Show the official scanner handoff below. */ }
      }
      status.textContent = 'The preview is unavailable right now. Open the full ShieldTX scanner above to check this address.';
    } finally {
      clearTimeout(timeout);
      if (request === controller) resetRequest();
    }
  }
  form.addEventListener('submit', event => { event.preventDefault(); runScan(); });
  sample.addEventListener('click', () => { input.value = sampleAddress; runScan(); });
  input.addEventListener('input', () => { resetRequest(); clearResults(); });
  $('#scan-results-close').addEventListener('click', () => { resetScanner(); input.focus({preventScroll:true}); });
  $('#scan-dialog').addEventListener('close', resetScanner);
})();
