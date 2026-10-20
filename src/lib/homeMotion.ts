// One scroll-entry treatment; visible HTML remains the no-JS fallback.
export function initHomeMotion() {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reducedMotion.matches || !('IntersectionObserver' in window)) return;
  const rootStyle = getComputedStyle(document.documentElement);
  const duration = parseFloat(rootStyle.getPropertyValue('--motion-entry')) || 700;
  const easing = rootStyle.getPropertyValue('--motion-ease').trim() || 'cubic-bezier(.22, 1, .36, 1)';
  const animations = new Map<Element, Animation>();
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(({ target, isIntersecting }) => {
      if (!isIntersecting) return;
      animations.get(target)?.play();
      observer.unobserve(target);
    });
  }, { rootMargin: '0px 0px -10% 0px' });

  document.querySelectorAll<HTMLElement>('.home-page [data-entry]').forEach((element) => {
    const animation = element.animate([
      { opacity: 0, transform: 'translateY(36px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ], { duration, delay: Number(element.dataset.entryDelay) || 0, easing, fill: 'backwards' });
    animation.pause();
    animations.set(element, animation);
    observer.observe(element);
    element.addEventListener('focusin', () => animation.finish());
  });
  reducedMotion.addEventListener('change', ({ matches }) => {
    if (!matches) return;
    observer.disconnect();
    animations.forEach((animation) => animation.finish());
  });
}
