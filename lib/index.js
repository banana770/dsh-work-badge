/**
 * dsh-work-badge — host half.
 *
 * This plugin is browser-side only: the whole feature lives in the client
 * bundle (lib/client.js), which registers one small label into the
 * `shell.overlay` slot showing 工作时间：峰 / 谷 (or "Work hours: Peak /
 * Off-peak") for the current Beijing time.
 *
 * The host half therefore needs no logic at all. It still has to exist as a
 * live (non-disabled) loader entry, because that is what dsh-client-modules
 * scans for: an empty no-op plugin is enough to keep the fiber alive and let
 * dsh-client pick up the ./client bundle next to it.
 *
 * 宿主侧为空插件：所有功能都在 lib/client.js 里，这里只保证 loader entry
 * 活跃，从而让客户端 bundle 被装载。
 */

export const name = "dsh-work-badge";

export const inject = [];

export const apply = () => {};
