function escapeHtml(html: string) {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

// Custom function to emit toast notifications
export function notify(
  message: string,
  variant: 'danger' | 'neutral' | 'primary' | 'success' | 'warning' = 'primary',
  icon = 'info-circle',
  duration = 2000
) {
  const alert = Object.assign(document.createElement('sl-alert'), {
    closable: true,
    duration: duration,
    innerHTML: `
      <sl-icon name="${icon}" slot="icon"></sl-icon>
      ${escapeHtml(message)}
    `,
    variant,
  });

  document.body.append(alert);
  return alert.toast();
}
