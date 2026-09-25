/**
 * dsh-work-badge — browser half (client plugin bundle).
 *
 * One click-through label in the frame-wide `shell.overlay` slot, pinned to the
 * top-left corner of the DSH content area - below the Windows desktop menu bar
 * and just above the DeepSeek brand. It answers a single question at a glance:
 * is Beijing time currently inside the platform's peak work window?
 *
 *     峰 / Peak       Mon-Fri, 09:00-12:00 or 14:00-18:00 (UTC+8)
 *     谷 / Off-peak   everything else, including the whole weekend
 *
 * Loaded by dsh-client-modules at /plugins/dsh-work-badge/client.js and executed
 * through the shell Loader's module table (window.__ModuleLoader__.load). Plain
 * CJS factory with require() resolved against the shell's vendored modules - the
 * same shape the shipped ui-* packages use.
 *
 * 界面文案中英双语，见下方 LANG；时间判断固定按北京时间（UTC+8）计算，
 * 与本机时区无关。插件纯本地运行：不联网、不读取任何数据、不含任何密钥。
 *
 * Updates: recomputed on mount, on tab re-visibility, and every 30 s, so a
 * boundary flip (12:00 / 14:00 / 18:00) appears within half a minute even in a
 * long-idle background tab.
 */
window.__ModuleLoader__.load({
	id: "dsh-work-badge",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

		const React = require("react");

		/** 客户端插件注入声明：只需要 slots（插槽注册）。 */
		const inject = ["slots"];

		/**
		 * UI language / 界面语言.
		 *
		 *   "auto" (default) - follow the browser locale: zh* shows Chinese text,
		 *                      every other language shows English text.
		 *   "zh"             - always 「工作时间：峰 / 谷」
		 *   "en"             - always "Work hours: Peak / Off-peak"
		 *
		 * Change this single line to pin one language for everybody.
		 */
		const LANG = "auto";

		const TEXT = {
			zh: {
				prefix: "工作时间：",
				peak: "峰",
				off: "谷",
				peakTitle: "高峰时段（北京时间周一至五 9:00-12:00 / 14:00-18:00）",
				offTitle: "空闲时段"
			},
			en: {
				prefix: "Work hours: ",
				peak: "Peak",
				off: "Off-peak",
				peakTitle: "Peak hours (Beijing time, Mon-Fri 09:00-12:00 / 14:00-18:00)",
				offTitle: "Off-peak hours"
			}
		};

		/** Resolve LANG once at load time; "auto" reads the browser locale. */
		function pickText() {
			if (LANG === "zh" || LANG === "en") return TEXT[LANG];
			let locale = "";
			if (typeof navigator !== "undefined") {
				locale = navigator.language || (navigator.languages && navigator.languages[0]) || "";
			}
			return /^zh/i.test(locale) ? TEXT.zh : TEXT.en;
		}

		const STRINGS = pickText();

		/**
		 * 北京时间墙钟（UTC+8 固定偏移，无夏令时）：把任意时刻平移成北京本地读数，
		 * 之后用 getDay()/getHours()/getMinutes() 读到的即是北京值。
		 */
		function beijingDate(date) {
			return new Date(date.getTime() + (date.getTimezoneOffset() + 8 * 60) * 60_000);
		}

		/**
		 * 高峰时段：北京时间周一至周五的 9:00-12:00 与 14:00-18:00。
		 * 按分钟计，含起点不含终点；周末与其余时间均为空闲时段。
		 *
		 * Peak hours: Beijing time, Monday to Friday, 09:00-12:00 and 14:00-18:00
		 * (by the minute, start inclusive / end exclusive). Weekends and
		 * everything else count as off-peak. Tweak the numbers below to re-target
		 * the window.
		 */
		function isPeakHour(date) {
			const d = beijingDate(date);
			const day = d.getDay(); // 0 = Sunday ... 6 = Saturday
			if (day < 1 || day > 5) return false;
			const minutes = d.getHours() * 60 + d.getMinutes();
			return (
				(minutes >= 9 * 60 && minutes < 12 * 60) ||
				(minutes >= 14 * 60 && minutes < 18 * 60)
			);
		}

		/** 刷新间隔：30 秒一次，配合 visibilitychange 兜底后台标签页。 */
		const TICK_MS = 30 * 1000;

		/**
		 * The label itself. Mounted in shell.overlay so it sits outside every
		 * column's scroll container. On the Windows desktop build the top offset
		 * respects DSH's own `--dsh-windows-titlebar-height`, so it sits below
		 * the 应用/编辑 menu bar instead of overlapping it. pointer-events stays
		 * "none" so it can never swallow a click meant for the brand or the icon
		 * underneath it.
		 */
		function WorkBadge() {
			const [isPeak, setIsPeak] = React.useState(() => isPeakHour(new Date()));

			React.useEffect(() => {
				const update = () => setIsPeak(isPeakHour(new Date()));
				const timer = window.setInterval(update, TICK_MS);
				const onVisibility = () => {
					if (document.visibilityState === "visible") update();
				};
				document.addEventListener("visibilitychange", onVisibility);
				return () => {
					window.clearInterval(timer);
					document.removeEventListener("visibilitychange", onVisibility);
				};
			}, []);

			return React.createElement(
				"div",
				{
					"data-work-badge": true,
					title: isPeak ? STRINGS.peakTitle : STRINGS.offTitle,
					style: {
						position: "absolute",
						top: "var(--dsh-windows-titlebar-height, 8px)",
						left: 10,
						fontSize: 10,
						lineHeight: "13px",
						padding: "0 4px",
						borderRadius: 999,
						background: "var(--dsw-alias-interactive-bg-hover, rgba(128,128,128,.16))",
						color: "var(--dsw-alias-label-secondary, #9aa4b2)",
						letterSpacing: "0.02em",
						whiteSpace: "nowrap",
						userSelect: "none",
						pointerEvents: "none"
					}
				},
				STRINGS.prefix,
				React.createElement(
					"span",
					{
						style: {
							marginLeft: 1,
							fontWeight: 600,
							color: isPeak
								? "var(--dsw-alias-state-business-primary, #4a9eff)"
								: "var(--dsw-alias-label-secondary, #9aa4b2)"
						}
					},
					isPeak ? STRINGS.peak : STRINGS.off
				)
			);
		}

		function apply(ctx) {
			return ctx.slots.inject("shell.overlay", () =>
				ctx.slots.register({
					name: "shell.overlay",
					id: "work-badge",
					order: 10,
					label: "Work hours badge"
				}, WorkBadge)
			);
		}

		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
