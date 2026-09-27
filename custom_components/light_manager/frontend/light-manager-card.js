//#region node_modules/@lit/reactive-element/css-tag.js
var e = globalThis, t = e.ShadowRoot && (e.ShadyCSS === void 0 || e.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, n = Symbol(), r = /* @__PURE__ */ new WeakMap(), i = class {
	constructor(e, t, r) {
		if (this._$cssResult$ = !0, r !== n) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
		this.cssText = e, this.t = t;
	}
	get styleSheet() {
		let e = this.o, n = this.t;
		if (t && e === void 0) {
			let t = n !== void 0 && n.length === 1;
			t && (e = r.get(n)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), t && r.set(n, e));
		}
		return e;
	}
	toString() {
		return this.cssText;
	}
}, a = (e) => new i(typeof e == "string" ? e : e + "", void 0, n), o = (e, ...t) => new i(e.length === 1 ? e[0] : t.reduce((t, n, r) => t + ((e) => {
	if (!0 === e._$cssResult$) return e.cssText;
	if (typeof e == "number") return e;
	throw Error("Value passed to 'css' function must be a 'css' function result: " + e + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
})(n) + e[r + 1], e[0]), e, n), s = (n, r) => {
	if (t) n.adoptedStyleSheets = r.map((e) => e instanceof CSSStyleSheet ? e : e.styleSheet);
	else for (let t of r) {
		let r = document.createElement("style"), i = e.litNonce;
		i !== void 0 && r.setAttribute("nonce", i), r.textContent = t.cssText, n.appendChild(r);
	}
}, c = t ? (e) => e : (e) => e instanceof CSSStyleSheet ? ((e) => {
	let t = "";
	for (let n of e.cssRules) t += n.cssText;
	return a(t);
})(e) : e, { is: l, defineProperty: u, getOwnPropertyDescriptor: d, getOwnPropertyNames: f, getOwnPropertySymbols: p, getPrototypeOf: m } = Object, h = globalThis, ee = h.trustedTypes, te = ee ? ee.emptyScript : "", ne = h.reactiveElementPolyfillSupport, g = (e, t) => e, _ = {
	toAttribute(e, t) {
		switch (t) {
			case Boolean:
				e = e ? te : null;
				break;
			case Object:
			case Array: e = e == null ? e : JSON.stringify(e);
		}
		return e;
	},
	fromAttribute(e, t) {
		let n = e;
		switch (t) {
			case Boolean:
				n = e !== null;
				break;
			case Number:
				n = e === null ? null : Number(e);
				break;
			case Object:
			case Array: try {
				n = JSON.parse(e);
			} catch {
				n = null;
			}
		}
		return n;
	}
}, re = (e, t) => !l(e, t), ie = {
	attribute: !0,
	type: String,
	converter: _,
	reflect: !1,
	useDefault: !1,
	hasChanged: re
};
Symbol.metadata ??= Symbol("metadata"), h.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
var v = class extends HTMLElement {
	static addInitializer(e) {
		this._$Ei(), (this.l ??= []).push(e);
	}
	static get observedAttributes() {
		return this.finalize(), this._$Eh && [...this._$Eh.keys()];
	}
	static createProperty(e, t = ie) {
		if (t.state && (t.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((t = Object.create(t)).wrapped = !0), this.elementProperties.set(e, t), !t.noAccessor) {
			let n = Symbol(), r = this.getPropertyDescriptor(e, n, t);
			r !== void 0 && u(this.prototype, e, r);
		}
	}
	static getPropertyDescriptor(e, t, n) {
		let { get: r, set: i } = d(this.prototype, e) ?? {
			get() {
				return this[t];
			},
			set(e) {
				this[t] = e;
			}
		};
		return {
			get: r,
			set(t) {
				let a = r?.call(this);
				i?.call(this, t), this.requestUpdate(e, a, n);
			},
			configurable: !0,
			enumerable: !0
		};
	}
	static getPropertyOptions(e) {
		return this.elementProperties.get(e) ?? ie;
	}
	static _$Ei() {
		if (this.hasOwnProperty(g("elementProperties"))) return;
		let e = m(this);
		e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
	}
	static finalize() {
		if (this.hasOwnProperty(g("finalized"))) return;
		if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(g("properties"))) {
			let e = this.properties, t = [...f(e), ...p(e)];
			for (let n of t) this.createProperty(n, e[n]);
		}
		let e = this[Symbol.metadata];
		if (e !== null) {
			let t = litPropertyMetadata.get(e);
			if (t !== void 0) for (let [e, n] of t) this.elementProperties.set(e, n);
		}
		this._$Eh = /* @__PURE__ */ new Map();
		for (let [e, t] of this.elementProperties) {
			let n = this._$Eu(e, t);
			n !== void 0 && this._$Eh.set(n, e);
		}
		this.elementStyles = this.finalizeStyles(this.styles);
	}
	static finalizeStyles(e) {
		let t = [];
		if (Array.isArray(e)) {
			let n = new Set(e.flat(1 / 0).reverse());
			for (let e of n) t.unshift(c(e));
		} else e !== void 0 && t.push(c(e));
		return t;
	}
	static _$Eu(e, t) {
		let n = t.attribute;
		return !1 === n ? void 0 : typeof n == "string" ? n : typeof e == "string" ? e.toLowerCase() : void 0;
	}
	constructor() {
		super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
	}
	_$Ev() {
		this._$ES = new Promise((e) => this.enableUpdating = e), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach((e) => e(this));
	}
	addController(e) {
		(this._$EO ??= /* @__PURE__ */ new Set()).add(e), this.renderRoot !== void 0 && this.isConnected && e.hostConnected?.();
	}
	removeController(e) {
		this._$EO?.delete(e);
	}
	_$E_() {
		let e = /* @__PURE__ */ new Map(), t = this.constructor.elementProperties;
		for (let n of t.keys()) this.hasOwnProperty(n) && (e.set(n, this[n]), delete this[n]);
		e.size > 0 && (this._$Ep = e);
	}
	createRenderRoot() {
		let e = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
		return s(e, this.constructor.elementStyles), e;
	}
	connectedCallback() {
		this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(!0), this._$EO?.forEach((e) => e.hostConnected?.());
	}
	enableUpdating(e) {}
	disconnectedCallback() {
		this._$EO?.forEach((e) => e.hostDisconnected?.());
	}
	attributeChangedCallback(e, t, n) {
		this._$AK(e, n);
	}
	_$ET(e, t) {
		let n = this.constructor.elementProperties.get(e), r = this.constructor._$Eu(e, n);
		if (r !== void 0 && !0 === n.reflect) {
			let i = (n.converter?.toAttribute === void 0 ? _ : n.converter).toAttribute(t, n.type);
			this._$Em = e, i == null ? this.removeAttribute(r) : this.setAttribute(r, i), this._$Em = null;
		}
	}
	_$AK(e, t) {
		let n = this.constructor, r = n._$Eh.get(e);
		if (r !== void 0 && this._$Em !== r) {
			let e = n.getPropertyOptions(r), i = typeof e.converter == "function" ? { fromAttribute: e.converter } : e.converter?.fromAttribute === void 0 ? _ : e.converter;
			this._$Em = r;
			let a = i.fromAttribute(t, e.type);
			this[r] = a ?? this._$Ej?.get(r) ?? a, this._$Em = null;
		}
	}
	requestUpdate(e, t, n, r = !1, i) {
		if (e !== void 0) {
			let a = this.constructor;
			if (!1 === r && (i = this[e]), n ??= a.getPropertyOptions(e), !((n.hasChanged ?? re)(i, t) || n.useDefault && n.reflect && i === this._$Ej?.get(e) && !this.hasAttribute(a._$Eu(e, n)))) return;
			this.C(e, t, n);
		}
		!1 === this.isUpdatePending && (this._$ES = this._$EP());
	}
	C(e, t, { useDefault: n, reflect: r, wrapped: i }, a) {
		n && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(e) && (this._$Ej.set(e, a ?? t ?? this[e]), !0 !== i || a !== void 0) || (this._$AL.has(e) || (this.hasUpdated || n || (t = void 0), this._$AL.set(e, t)), !0 === r && this._$Em !== e && (this._$Eq ??= /* @__PURE__ */ new Set()).add(e));
	}
	async _$EP() {
		this.isUpdatePending = !0;
		try {
			await this._$ES;
		} catch (e) {
			Promise.reject(e);
		}
		let e = this.scheduleUpdate();
		return e != null && await e, !this.isUpdatePending;
	}
	scheduleUpdate() {
		return this.performUpdate();
	}
	performUpdate() {
		if (!this.isUpdatePending) return;
		if (!this.hasUpdated) {
			if (this.renderRoot ??= this.createRenderRoot(), this._$Ep) {
				for (let [e, t] of this._$Ep) this[e] = t;
				this._$Ep = void 0;
			}
			let e = this.constructor.elementProperties;
			if (e.size > 0) for (let [t, n] of e) {
				let { wrapped: e } = n, r = this[t];
				!0 !== e || this._$AL.has(t) || r === void 0 || this.C(t, void 0, n, r);
			}
		}
		let e = !1, t = this._$AL;
		try {
			e = this.shouldUpdate(t), e ? (this.willUpdate(t), this._$EO?.forEach((e) => e.hostUpdate?.()), this.update(t)) : this._$EM();
		} catch (t) {
			throw e = !1, this._$EM(), t;
		}
		e && this._$AE(t);
	}
	willUpdate(e) {}
	_$AE(e) {
		this._$EO?.forEach((e) => e.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(e)), this.updated(e);
	}
	_$EM() {
		this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = !1;
	}
	get updateComplete() {
		return this.getUpdateComplete();
	}
	getUpdateComplete() {
		return this._$ES;
	}
	shouldUpdate(e) {
		return !0;
	}
	update(e) {
		this._$Eq &&= this._$Eq.forEach((e) => this._$ET(e, this[e])), this._$EM();
	}
	updated(e) {}
	firstUpdated(e) {}
};
v.elementStyles = [], v.shadowRootOptions = { mode: "open" }, v[g("elementProperties")] = /* @__PURE__ */ new Map(), v[g("finalized")] = /* @__PURE__ */ new Map(), ne?.({ ReactiveElement: v }), (h.reactiveElementVersions ??= []).push("2.1.2");
//#endregion
//#region node_modules/lit-html/lit-html.js
var y = globalThis, ae = (e) => e, b = y.trustedTypes, oe = b ? b.createPolicy("lit-html", { createHTML: (e) => e }) : void 0, x = "$lit$", S = `lit$${Math.random().toFixed(9).slice(2)}$`, C = "?" + S, se = `<${C}>`, w = document, T = () => w.createComment(""), E = (e) => e === null || typeof e != "object" && typeof e != "function", D = Array.isArray, ce = (e) => D(e) || typeof e?.[Symbol.iterator] == "function", O = "[ 	\n\f\r]", k = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, A = /-->/g, le = />/g, j = RegExp(`>|${O}(?:([^\\s"'>=/]+)(${O}*=${O}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`, "g"), ue = /'/g, de = /"/g, fe = /^(?:script|style|textarea|title)$/i, M = ((e) => (t, ...n) => ({
	_$litType$: e,
	strings: t,
	values: n
}))(1), N = Symbol.for("lit-noChange"), P = Symbol.for("lit-nothing"), pe = /* @__PURE__ */ new WeakMap(), F = w.createTreeWalker(w, 129);
function me(e, t) {
	if (!D(e) || !e.hasOwnProperty("raw")) throw Error("invalid template strings array");
	return oe === void 0 ? t : oe.createHTML(t);
}
var he = (e, t) => {
	let n = e.length - 1, r = [], i, a = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", o = k;
	for (let t = 0; t < n; t++) {
		let n = e[t], s, c, l = -1, u = 0;
		for (; u < n.length && (o.lastIndex = u, c = o.exec(n), c !== null);) u = o.lastIndex, o === k ? c[1] === "!--" ? o = A : c[1] === void 0 ? c[2] === void 0 ? c[3] !== void 0 && (o = j) : (fe.test(c[2]) && (i = RegExp("</" + c[2], "g")), o = j) : o = le : o === j ? c[0] === ">" ? (o = i ?? k, l = -1) : c[1] === void 0 ? l = -2 : (l = o.lastIndex - c[2].length, s = c[1], o = c[3] === void 0 ? j : c[3] === "\"" ? de : ue) : o === de || o === ue ? o = j : o === A || o === le ? o = k : (o = j, i = void 0);
		let d = o === j && e[t + 1].startsWith("/>") ? " " : "";
		a += o === k ? n + se : l >= 0 ? (r.push(s), n.slice(0, l) + x + n.slice(l) + S + d) : n + S + (l === -2 ? t : d);
	}
	return [me(e, a + (e[n] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), r];
}, I = class e {
	constructor({ strings: t, _$litType$: n }, r) {
		let i;
		this.parts = [];
		let a = 0, o = 0, s = t.length - 1, c = this.parts, [l, u] = he(t, n);
		if (this.el = e.createElement(l, r), F.currentNode = this.el.content, n === 2 || n === 3) {
			let e = this.el.content.firstChild;
			e.replaceWith(...e.childNodes);
		}
		for (; (i = F.nextNode()) !== null && c.length < s;) {
			if (i.nodeType === 1) {
				if (i.hasAttributes()) for (let e of i.getAttributeNames()) if (e.endsWith(x)) {
					let t = u[o++], n = i.getAttribute(e).split(S), r = /([.?@])?(.*)/.exec(t);
					c.push({
						type: 1,
						index: a,
						name: r[2],
						strings: n,
						ctor: r[1] === "." ? ge : r[1] === "?" ? _e : r[1] === "@" ? ve : B
					}), i.removeAttribute(e);
				} else e.startsWith(S) && (c.push({
					type: 6,
					index: a
				}), i.removeAttribute(e));
				if (fe.test(i.tagName)) {
					let e = i.textContent.split(S), t = e.length - 1;
					if (t > 0) {
						i.textContent = b ? b.emptyScript : "";
						for (let n = 0; n < t; n++) i.append(e[n], T()), F.nextNode(), c.push({
							type: 2,
							index: ++a
						});
						i.append(e[t], T());
					}
				}
			} else if (i.nodeType === 8) {
				if (i.data === C) c.push({
					type: 2,
					index: a
				});
				else {
					let e = -1;
					for (; (e = i.data.indexOf(S, e + 1)) !== -1;) c.push({
						type: 7,
						index: a
					}), e += S.length - 1;
				}
			}
			a++;
		}
	}
	static createElement(e, t) {
		let n = w.createElement("template");
		return n.innerHTML = e, n;
	}
};
function L(e, t, n = e, r) {
	if (t === N) return t;
	let i = r === void 0 ? n._$Cl : n._$Co?.[r], a = E(t) ? void 0 : t._$litDirective$;
	return i?.constructor !== a && (i?._$AO?.(!1), a === void 0 ? i = void 0 : (i = new a(e), i._$AT(e, n, r)), r === void 0 ? n._$Cl = i : (n._$Co ??= [])[r] = i), i !== void 0 && (t = L(e, i._$AS(e, t.values), i, r)), t;
}
var R = class {
	constructor(e, t) {
		this._$AV = [], this._$AN = void 0, this._$AD = e, this._$AM = t;
	}
	get parentNode() {
		return this._$AM.parentNode;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	u(e) {
		let { el: { content: t }, parts: n } = this._$AD, r = (e?.creationScope ?? w).importNode(t, !0);
		F.currentNode = r;
		let i = F.nextNode(), a = 0, o = 0, s = n[0];
		for (; s !== void 0;) {
			if (a === s.index) {
				let t;
				s.type === 2 ? t = new z(i, i.nextSibling, this, e) : s.type === 1 ? t = new s.ctor(i, s.name, s.strings, this, e) : s.type === 6 && (t = new ye(i, this, e)), this._$AV.push(t), s = n[++o];
			}
			a !== s?.index && (i = F.nextNode(), a++);
		}
		return F.currentNode = w, r;
	}
	p(e) {
		let t = 0;
		for (let n of this._$AV) n !== void 0 && (n.strings === void 0 ? n._$AI(e[t]) : (n._$AI(e, n, t), t += n.strings.length - 2)), t++;
	}
}, z = class e {
	get _$AU() {
		return this._$AM?._$AU ?? this._$Cv;
	}
	constructor(e, t, n, r) {
		this.type = 2, this._$AH = P, this._$AN = void 0, this._$AA = e, this._$AB = t, this._$AM = n, this.options = r, this._$Cv = r?.isConnected ?? !0;
	}
	get parentNode() {
		let e = this._$AA.parentNode, t = this._$AM;
		return t !== void 0 && e?.nodeType === 11 && (e = t.parentNode), e;
	}
	get startNode() {
		return this._$AA;
	}
	get endNode() {
		return this._$AB;
	}
	_$AI(e, t = this) {
		e = L(this, e, t), E(e) ? e === P || e == null || e === "" ? (this._$AH !== P && this._$AR(), this._$AH = P) : e !== this._$AH && e !== N && this._(e) : e._$litType$ === void 0 ? e.nodeType === void 0 ? ce(e) ? this.k(e) : this._(e) : this.T(e) : this.$(e);
	}
	O(e) {
		return this._$AA.parentNode.insertBefore(e, this._$AB);
	}
	T(e) {
		this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
	}
	_(e) {
		this._$AH !== P && E(this._$AH) ? this._$AA.nextSibling.data = e : this.T(w.createTextNode(e)), this._$AH = e;
	}
	$(e) {
		let { values: t, _$litType$: n } = e, r = typeof n == "number" ? this._$AC(e) : (n.el === void 0 && (n.el = I.createElement(me(n.h, n.h[0]), this.options)), n);
		if (this._$AH?._$AD === r) this._$AH.p(t);
		else {
			let e = new R(r, this), n = e.u(this.options);
			e.p(t), this.T(n), this._$AH = e;
		}
	}
	_$AC(e) {
		let t = pe.get(e.strings);
		return t === void 0 && pe.set(e.strings, t = new I(e)), t;
	}
	k(t) {
		D(this._$AH) || (this._$AH = [], this._$AR());
		let n = this._$AH, r, i = 0;
		for (let a of t) i === n.length ? n.push(r = new e(this.O(T()), this.O(T()), this, this.options)) : r = n[i], r._$AI(a), i++;
		i < n.length && (this._$AR(r && r._$AB.nextSibling, i), n.length = i);
	}
	_$AR(e = this._$AA.nextSibling, t) {
		for (this._$AP?.(!1, !0, t); e !== this._$AB;) {
			let t = ae(e).nextSibling;
			ae(e).remove(), e = t;
		}
	}
	setConnected(e) {
		this._$AM === void 0 && (this._$Cv = e, this._$AP?.(e));
	}
}, B = class {
	get tagName() {
		return this.element.tagName;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	constructor(e, t, n, r, i) {
		this.type = 1, this._$AH = P, this._$AN = void 0, this.element = e, this.name = t, this._$AM = r, this.options = i, n.length > 2 || n[0] !== "" || n[1] !== "" ? (this._$AH = Array(n.length - 1).fill(/* @__PURE__ */ new String()), this.strings = n) : this._$AH = P;
	}
	_$AI(e, t = this, n, r) {
		let i = this.strings, a = !1;
		if (i === void 0) e = L(this, e, t, 0), a = !E(e) || e !== this._$AH && e !== N, a && (this._$AH = e);
		else {
			let r = e, o, s;
			for (e = i[0], o = 0; o < i.length - 1; o++) s = L(this, r[n + o], t, o), s === N && (s = this._$AH[o]), a ||= !E(s) || s !== this._$AH[o], s === P ? e = P : e !== P && (e += (s ?? "") + i[o + 1]), this._$AH[o] = s;
		}
		a && !r && this.j(e);
	}
	j(e) {
		e === P ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
	}
}, ge = class extends B {
	constructor() {
		super(...arguments), this.type = 3;
	}
	j(e) {
		this.element[this.name] = e === P ? void 0 : e;
	}
}, _e = class extends B {
	constructor() {
		super(...arguments), this.type = 4;
	}
	j(e) {
		this.element.toggleAttribute(this.name, !!e && e !== P);
	}
}, ve = class extends B {
	constructor(e, t, n, r, i) {
		super(e, t, n, r, i), this.type = 5;
	}
	_$AI(e, t = this) {
		if ((e = L(this, e, t, 0) ?? P) === N) return;
		let n = this._$AH, r = e === P && n !== P || e.capture !== n.capture || e.once !== n.once || e.passive !== n.passive, i = e !== P && (n === P || r);
		r && this.element.removeEventListener(this.name, this, n), i && this.element.addEventListener(this.name, this, e), this._$AH = e;
	}
	handleEvent(e) {
		typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, e) : this._$AH.handleEvent(e);
	}
}, ye = class {
	constructor(e, t, n) {
		this.element = e, this.type = 6, this._$AN = void 0, this._$AM = t, this.options = n;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	_$AI(e) {
		L(this, e);
	}
}, be = {
	M: x,
	P: S,
	A: C,
	C: 1,
	L: he,
	R,
	D: ce,
	V: L,
	I: z,
	H: B,
	N: _e,
	U: ve,
	B: ge,
	F: ye
}, xe = y.litHtmlPolyfillSupport;
xe?.(I, z), (y.litHtmlVersions ??= []).push("3.3.3");
var Se = (e, t, n) => {
	let r = n?.renderBefore ?? t, i = r._$litPart$;
	if (i === void 0) {
		let e = n?.renderBefore ?? null;
		r._$litPart$ = i = new z(t.insertBefore(T(), e), e, void 0, n ?? {});
	}
	return i._$AI(e), i;
}, V = globalThis, H = class extends v {
	constructor() {
		super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
	}
	createRenderRoot() {
		let e = super.createRenderRoot();
		return this.renderOptions.renderBefore ??= e.firstChild, e;
	}
	update(e) {
		let t = this.render();
		this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = Se(t, this.renderRoot, this.renderOptions);
	}
	connectedCallback() {
		super.connectedCallback(), this._$Do?.setConnected(!0);
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this._$Do?.setConnected(!1);
	}
	render() {
		return N;
	}
};
H._$litElement$ = !0, H.finalized = !0, V.litElementHydrateSupport?.({ LitElement: H });
var Ce = V.litElementPolyfillSupport;
Ce?.({ LitElement: H }), (V.litElementVersions ??= []).push("4.2.2");
//#endregion
//#region src/controls.ts
var we = class extends H {
	static {
		this.properties = {
			on: {
				type: Boolean,
				reflect: !0
			},
			disabled: { type: Boolean }
		};
	}
	constructor() {
		super(), this.on = !1, this.disabled = !1;
	}
	static {
		this.styles = o`
    :host {
      display: inline-block;
      --lm-track: rgba(0, 0, 0, 0.22);
    }
    button {
      all: unset;
      box-sizing: border-box;
      display: block;
      width: 52px;
      height: 32px;
      border-radius: 16px;
      background: var(--lm-track);
      position: relative;
      cursor: pointer;
      transition: background 0.2s;
    }
    button:focus-visible {
      outline: 2px solid currentColor;
      outline-offset: 2px;
    }
    .knob {
      position: absolute;
      top: 3px;
      left: 3px;
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: #fff;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.35);
      transition: transform 0.2s;
    }
    :host([on]) .knob {
      transform: translateX(20px);
    }
    button[disabled] {
      opacity: 0.5;
      cursor: default;
    }
  `;
	}
	render() {
		return M`<button
      role="switch"
      aria-checked=${this.on ? "true" : "false"}
      ?disabled=${this.disabled}
      @click=${this._click}
    >
      <span class="knob"></span>
    </button>`;
	}
	_click(e) {
		e.stopPropagation(), !this.disabled && this.dispatchEvent(new CustomEvent("change", { detail: { on: !this.on } }));
	}
}, U = 26, Te = class extends H {
	static {
		this.properties = {
			value: { type: Number },
			disabled: {
				type: Boolean,
				reflect: !0
			},
			_dragValue: { state: !0 }
		};
	}
	constructor() {
		super(), this._lastSent = 0, this._pending = null, this.value = 0, this.disabled = !1, this._dragValue = null;
	}
	static {
		this.styles = o`
    :host {
      display: block;
      touch-action: none;
      --lm-track: rgba(0, 0, 0, 0.18);
      --lm-fill: rgba(255, 255, 255, 0.45);
    }
    .hit {
      position: relative;
      height: 32px;
      cursor: pointer;
    }
    .track,
    .fill {
      position: absolute;
      left: 0;
      top: 50%;
      height: 12px;
      margin-top: -6px;
      border-radius: 6px;
    }
    .track {
      right: 0;
      background: var(--lm-track);
    }
    .fill {
      background: var(--lm-fill);
    }
    .thumb {
      position: absolute;
      top: 50%;
      width: 26px;
      height: 26px;
      margin: -13px 0 0 -13px;
      border-radius: 50%;
      background: #fff;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
    }
    :host([disabled]) .fill,
    :host([disabled]) .thumb {
      display: none;
    }
  `;
	}
	render() {
		let e = this._dragValue ?? this.value, t = `calc(${U / 2}px + (100% - ${U}px) * ${e})`;
		return M`<div
      class="hit"
      role="slider"
      aria-valuemin="1"
      aria-valuemax="100"
      aria-valuenow=${Math.round(e * 100)}
      aria-disabled=${this.disabled ? "true" : "false"}
      tabindex=${this.disabled ? "-1" : "0"}
      @pointerdown=${this._down}
      @pointermove=${this._move}
      @pointerup=${this._up}
      @pointercancel=${this._up}
      @keydown=${this._key}
      @click=${(e) => e.stopPropagation()}
    >
      <div class="track"></div>
      <div class="fill" style="width:${t}"></div>
      <div class="thumb" style="left:${t}"></div>
    </div>`;
	}
	_valueAt(e) {
		let t = e.currentTarget.getBoundingClientRect(), n = (e.clientX - t.left - U / 2) / (t.width - U);
		return Math.max(.01, Math.min(1, n));
	}
	_down(e) {
		this.disabled || (e.stopPropagation(), e.currentTarget.setPointerCapture(e.pointerId), this._dragValue = this._valueAt(e), this._send(this._dragValue, !1));
	}
	_move(e) {
		this._dragValue !== null && (this._dragValue = this._valueAt(e), this._send(this._dragValue, !1));
	}
	_up(e) {
		if (this._dragValue === null) return;
		let t = this._valueAt(e);
		this._dragValue = null, this.value = t, this._send(t, !0);
	}
	_key(e) {
		if (this.disabled) return;
		let t = e.key === "ArrowRight" || e.key === "ArrowUp" ? .05 : e.key === "ArrowLeft" || e.key === "ArrowDown" ? -.05 : 0;
		t && (e.preventDefault(), this.value = Math.max(.01, Math.min(1, this.value + t)), this._send(this.value, !0));
	}
	_send(e, t) {
		window.clearTimeout(this._timer);
		let n = Date.now();
		if (t || n - this._lastSent >= 400) {
			this._lastSent = n, this._pending = null, this.dispatchEvent(new CustomEvent("change", { detail: { value: e } }));
			return;
		}
		this._pending = e, this._timer = window.setTimeout(() => {
			this._pending !== null && this._send(this._pending, !0);
		}, 400 - (n - this._lastSent));
	}
};
customElements.get("lm-toggle") || customElements.define("lm-toggle", we), customElements.get("lm-slider") || customElements.define("lm-slider", Te);
//#endregion
//#region src/color.ts
var Ee = [
	252,
	214,
	140
], De = "linear-gradient(135deg, #454545, #333333)";
function Oe(e) {
	let t = e / 100, n = (e) => Math.round(Math.max(0, Math.min(255, e))), r = t <= 66 ? 255 : 329.698727446 * (t - 60) ** -.1332047592, i = t <= 66 ? 99.4708025861 * Math.log(t) - 161.1195681661 : 288.1221695283 * (t - 60) ** -.0755148492, a = t >= 66 ? 255 : t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
	return [
		n(r),
		n(i),
		n(a)
	];
}
function ke(e) {
	if (!e || e.state !== "on") return null;
	let t = e.attributes;
	return Array.isArray(t.rgb_color) ? t.rgb_color.slice(0, 3) : typeof t.color_temp_kelvin == "number" ? Ae(Oe(t.color_temp_kelvin), .3) : Ee;
}
function Ae([e, t, n], r) {
	let i = (e) => Math.round(e + (255 - e) * r);
	return [
		i(e),
		i(t),
		i(n)
	];
}
function W([e, t, n], r) {
	let i = .3 + .7 * Math.max(0, Math.min(1, r));
	return [
		Math.round(e * i),
		Math.round(t * i),
		Math.round(n * i)
	];
}
var G = ([e, t, n]) => `rgb(${e}, ${t}, ${n})`;
function K(e, t = 1) {
	if (e.length === 0) return De;
	let n = e.map((e) => W(e, t));
	return `linear-gradient(to bottom, rgba(0,0,0,0) 45%, rgba(0,0,0,0.28) 100%), linear-gradient(100deg, ${(n.length === 1 ? [G(n[0]), G(W(n[0], .75))] : n.map(G)).join(", ")})`;
}
function je([e, t, n]) {
	let r = (e) => {
		let t = e / 255;
		return t <= .03928 ? t / 12.92 : ((t + .055) / 1.055) ** 2.4;
	};
	return .2126 * r(e) + .7152 * r(t) + .0722 * r(n);
}
function q(e, t = 1) {
	if (e.length === 0) return "#ffffff";
	let n = e.map((e) => W(e, t));
	return n.reduce((e, t) => e + je(t), 0) / n.length > .45 ? "#2b2b2b" : "#ffffff";
}
function Me(e, t = 5) {
	let n = [];
	for (let r of e) if (n.some((e) => Math.abs(e[0] - r[0]) + Math.abs(e[1] - r[1]) + Math.abs(e[2] - r[2]) < 24) || n.push(r), n.length >= t) break;
	return n;
}
//#endregion
//#region node_modules/lit-html/directive.js
var Ne = {
	ATTRIBUTE: 1,
	CHILD: 2,
	PROPERTY: 3,
	BOOLEAN_ATTRIBUTE: 4,
	EVENT: 5,
	ELEMENT: 6
}, Pe = (e) => (...t) => ({
	_$litDirective$: e,
	values: t
}), Fe = class {
	constructor(e) {}
	get _$AU() {
		return this._$AM._$AU;
	}
	_$AT(e, t, n) {
		this._$Ct = e, this._$AM = t, this._$Ci = n;
	}
	_$AS(e, t) {
		return this.update(e, t);
	}
	update(e, t) {
		return this.render(...t);
	}
}, { I: Ie } = be, Le = (e) => e, Re = () => document.createComment(""), J = (e, t, n) => {
	let r = e._$AA.parentNode, i = t === void 0 ? e._$AB : t._$AA;
	if (n === void 0) n = new Ie(r.insertBefore(Re(), i), r.insertBefore(Re(), i), e, e.options);
	else {
		let t = n._$AB.nextSibling, a = n._$AM, o = a !== e;
		if (o) {
			let t;
			n._$AQ?.(e), n._$AM = e, n._$AP !== void 0 && (t = e._$AU) !== a._$AU && n._$AP(t);
		}
		if (t !== i || o) {
			let e = n._$AA;
			for (; e !== t;) {
				let t = Le(e).nextSibling;
				Le(r).insertBefore(e, i), e = t;
			}
		}
	}
	return n;
}, Y = (e, t, n = e) => (e._$AI(t, n), e), ze = {}, Be = (e, t = ze) => e._$AH = t, Ve = (e) => e._$AH, X = (e) => {
	e._$AR(), e._$AA.remove();
}, He = (e, t, n) => {
	let r = /* @__PURE__ */ new Map();
	for (let i = t; i <= n; i++) r.set(e[i], i);
	return r;
}, Ue = Pe(class extends Fe {
	constructor(e) {
		if (super(e), e.type !== Ne.CHILD) throw Error("repeat() can only be used in text expressions");
	}
	dt(e, t, n) {
		let r;
		n === void 0 ? n = t : t !== void 0 && (r = t);
		let i = [], a = [], o = 0;
		for (let t of e) i[o] = r ? r(t, o) : o, a[o] = n(t, o), o++;
		return {
			values: a,
			keys: i
		};
	}
	render(e, t, n) {
		return this.dt(e, t, n).values;
	}
	update(e, [t, n, r]) {
		let i = Ve(e), { values: a, keys: o } = this.dt(t, n, r);
		if (!Array.isArray(i)) return this.ut = o, a;
		let s = this.ut ??= [], c = [], l, u, d = 0, f = i.length - 1, p = 0, m = a.length - 1;
		for (; d <= f && p <= m;) if (i[d] === null) d++;
		else if (i[f] === null) f--;
		else if (s[d] === o[p]) c[p] = Y(i[d], a[p]), d++, p++;
		else if (s[f] === o[m]) c[m] = Y(i[f], a[m]), f--, m--;
		else if (s[d] === o[m]) c[m] = Y(i[d], a[m]), J(e, c[m + 1], i[d]), d++, m--;
		else if (s[f] === o[p]) c[p] = Y(i[f], a[p]), J(e, i[d], i[f]), f--, p++;
		else if (l === void 0 && (l = He(o, p, m), u = He(s, d, f)), l.has(s[d])) {
			if (l.has(s[f])) {
				let t = u.get(o[p]), n = t === void 0 ? null : i[t];
				if (n === null) {
					let t = J(e, i[d]);
					Y(t, a[p]), c[p] = t;
				} else c[p] = Y(n, a[p]), J(e, i[d], n), i[t] = null;
				p++;
			} else X(i[f]), f--;
		} else X(i[d]), d++;
		for (; p <= m;) {
			let t = J(e, c[m + 1]);
			Y(t, a[p]), c[p++] = t;
		}
		for (; d <= f;) {
			let e = i[d++];
			e !== null && X(e);
		}
		return this.ut = o, Be(e, c), N;
	}
}), We = class extends H {
	static {
		this.properties = {
			background: { type: String },
			_layers: { state: !0 }
		};
	}
	constructor() {
		super(), this._key = 0, this.background = "", this._layers = [];
	}
	willUpdate(e) {
		e.has("background") && this._layers[this._layers.length - 1]?.background !== this.background && (this._layers = [...this._layers.slice(-1), {
			key: ++this._key,
			background: this.background
		}]);
	}
	render() {
		return Ue(this._layers, (e) => e.key, (e, t) => M`<div
          class=${t === this._layers.length - 1 && this._layers.length > 1 ? "in" : ""}
          style="background: ${e.background}"
          @animationend=${this._settled}
        ></div>`);
	}
	_settled() {
		this._layers = this._layers.slice(-1);
	}
	static {
		this.styles = o`
    :host {
      position: absolute;
      inset: 0;
      border-radius: inherit;
      overflow: hidden;
      pointer-events: none;
      z-index: 0;
    }
    div {
      position: absolute;
      inset: 0;
    }
    .in {
      animation: fade-in var(--lm-fade-duration, 0.8s) ease forwards;
    }
    @keyframes fade-in {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
  `;
	}
};
customElements.get("lm-fade") || customElements.define("lm-fade", We);
//#endregion
//#region src/header.ts
function Ge(e) {
	return e.on ? K(e.colors, e.level) : De;
}
function Ke(e) {
	let t = e.on ? K(e.colors, e.level) : void 0, n = e.on ? q(e.colors, e.level) : "#ffffff", r = n !== "#ffffff";
	return [
		t ? `--lm-bg: ${t}` : "",
		`--lm-fg: ${n}`,
		`--lm-track: ${r ? "rgba(0,0,0,0.16)" : "rgba(255,255,255,0.18)"}`,
		`--lm-fill: ${r ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.45)"}`
	].filter(Boolean).join("; ");
}
function qe(e, t) {
	return M`<lm-slider
    .value=${e.level}
    ?disabled=${!e.on}
    @change=${t}
  ></lm-slider>`;
}
function Je(e, t) {
	return M`<lm-toggle .on=${e.on} @change=${t}></lm-toggle>`;
}
var Z = (e) => e ? M`<ha-icon .icon=${e}></ha-icon>` : P, Ye = o`
  :host {
    --lm-bg: linear-gradient(135deg, #454545, #333333);
    --lm-fg: #ffffff;
  }
  ha-icon {
    --mdc-icon-size: 28px;
    display: flex;
  }
`, Q = /* @__PURE__ */ new Map();
function Xe(e, t, n = !1) {
	let r = Q.get(t);
	return (!r || n) && (r = e.callWS({
		type: "light_manager/room",
		area_id: t
	}), r.catch(() => Q.delete(t)), Q.set(t, r)), r;
}
var Ze = 6e3, $ = /* @__PURE__ */ new Map();
function Qe(e, t, n) {
	let r = n.lights ?? {};
	return $.set(t.area_id, {
		sceneId: n.entity_id,
		lights: r,
		seen: Object.fromEntries(Object.keys(r).map((t) => [t, e.states[t]?.last_updated])),
		until: Date.now() + Ze
	}), e.callService("scene", "turn_on", void 0, { entity_id: n.entity_id });
}
function $e(e, t, n) {
	let r = $.get(t);
	if (!r || Date.now() > r.until) return null;
	let i = r.lights[n];
	return !i || e.states[n]?.last_updated !== r.seen[n] ? null : i;
}
function et(e) {
	let t = $.get(e);
	return t && Date.now() <= t.until ? t.sceneId : null;
}
function tt(e, t, n) {
	let r = e.states[n], i = r && r.state !== "unavailable" ? $e(e, t, n) : null;
	return i ? {
		color: i.on ? i.rgb ?? Ee : null,
		brightness: i.brightness,
		on: i.on,
		state: r
	} : {
		color: ke(r),
		brightness: r?.attributes.brightness ?? 255,
		on: r?.state === "on",
		state: r
	};
}
function nt(e, t) {
	let n = [], r = 0;
	for (let i of t.lights) {
		let a = tt(e, t.area_id, i);
		a.color && (n.push(a.color), r = Math.max(r, a.brightness));
	}
	let i = t.dimmer ? e.states[t.dimmer] : void 0, a = !!i && i.state !== "unavailable", o = et(t.area_id), s = o && i?.attributes.active_scene !== o ? 1 : a ? (i.attributes.brightness ?? 255) / 255 : r / 255;
	return {
		on: n.length > 0,
		colors: Me(n),
		level: n.length ? s : 0,
		dimmerAvailable: a,
		activeScene: o ?? (a ? i.attributes.active_scene ?? null : null)
	};
}
function rt(e, t, n, r) {
	return n.dimmerAvailable && t.dimmer ? e.callService("light", r ? "turn_on" : "turn_off", void 0, { entity_id: t.dimmer }) : e.callService("light", r ? "turn_on" : "turn_off", void 0, { entity_id: t.lights });
}
function it(e, t, n, r) {
	let i = Math.max(1, Math.round(r * 100)), a = n.dimmerAvailable && t.dimmer ? t.dimmer : t.lights;
	return e.callService("light", "turn_on", { brightness_pct: i }, { entity_id: a });
}
//#endregion
//#region src/room-dialog.ts
var at = class extends H {
	constructor(...e) {
		super(...e), this._onPop = () => this.close(!1), this._onKey = (e) => e.key === "Escape" && this.close();
	}
	static {
		this.properties = {
			hass: { attribute: !1 },
			room: { attribute: !1 },
			areaId: { type: String }
		};
	}
	connectedCallback() {
		super.connectedCallback(), history.pushState({ lightManagerDialog: !0 }, ""), window.addEventListener("popstate", this._onPop), window.addEventListener("keydown", this._onKey), Xe(this.hass, this.areaId, !0).then((e) => this.room = e, () => {});
	}
	disconnectedCallback() {
		super.disconnectedCallback(), window.removeEventListener("popstate", this._onPop), window.removeEventListener("keydown", this._onKey);
	}
	close(e = !0) {
		this.isConnected && (this.remove(), e && history.state?.lightManagerDialog && history.back(), this.dispatchEvent(new CustomEvent("closed")));
	}
	render() {
		let e = this.room, t = nt(this.hass, e);
		return M`<div class="backdrop" @click=${() => this.close()}></div>
      <div class="panel" role="dialog" aria-label=${e.name}>
        <header style=${Ke(t)}>
          <lm-fade .background=${Ge(t)}></lm-fade>
          <div class="row">
            <button class="round" aria-label="Back" @click=${() => this.close()}>
              ${Z("mdi:arrow-left")}
            </button>
            <span class="title">${e.name}</span>
            ${Je(t, (n) => rt(this.hass, e, t, n.detail.on))}
          </div>
          ${qe(t, (n) => it(this.hass, e, t, n.detail.value))}
        </header>
        <div class="body">
          ${e.scenes.length ? M`<h3>My scenes</h3>
                <div class="tiles">
                  ${e.scenes.map((e) => this._scene(e, e.entity_id === t.activeScene))}
                </div>` : P}
          ${ot(this.hass, e.lights).length ? M`<h3>Lights</h3>
                <div class="tiles">
                  ${ot(this.hass, e.lights).map((e) => this._light(e))}
                </div>` : P}
        </div>
      </div>`;
	}
	_scene(e, t) {
		let n = e.colors.length ? e.colors : [[
			255,
			197,
			143
		]], r = n.length === 1 ? `radial-gradient(circle at 32% 28%, rgb(${Ae(n[0], .45).join(",")}), rgb(${n[0].join(",")}) 65%)` : `linear-gradient(135deg, ${n.map((e) => `rgb(${e.join(",")})`).join(", ")})`, i = st(e.name, this.room.name);
		return M`<button
      class="scene ${t ? "active" : ""}"
      style=${t ? `background: ${K(n)}; color: ${q(n)}` : ""}
      @click=${() => this._apply(e)}
    >
      <span class="circle" style="background: ${r}">
        ${t ? M`<span class="playing">${Z("mdi:check")}</span>` : P}
      </span>
      <span class="label">${i}</span>
    </button>`;
	}
	_apply(e) {
		Qe(this.hass, this.room, e), this._refreshAll(), window.clearTimeout(this._optimisticTimer), this._optimisticTimer = window.setTimeout(() => this._refreshAll(), Ze + 50);
	}
	_refreshAll() {
		this.requestUpdate(), this.card?.requestUpdate();
	}
	_light(e) {
		let t = tt(this.hass, this.room.area_id, e), n = t.state, r = st(n?.attributes.friendly_name ?? e, this.room.name), i = t.color, a = t.brightness / 255, o = i ? `linear-gradient(to bottom, rgb(${W(i, a).join(",")}), rgb(${W(i, a * .7).join(",")}))` : "#3a3a3a", s = i ? `color: ${q([i], a)}` : "";
		return M`<div class="light ${i ? "on" : ""}" style=${s} @click=${() => this._moreInfo(e)}>
      <lm-fade .background=${o}></lm-fade>
      <div class="top">
        ${n ? M`<ha-state-icon .hass=${this.hass} .stateObj=${n}></ha-state-icon>` : Z("mdi:lightbulb")}
        <span class="lname">${r}</span>
      </div>
      <div class="bottom">
        <lm-toggle
          .on=${t.on}
          @change=${(t) => this.hass.callService("light", t.detail.on ? "turn_on" : "turn_off", void 0, { entity_id: e })}
        ></lm-toggle>
      </div>
    </div>`;
	}
	_moreInfo(e) {
		(this.card ?? this).dispatchEvent(new CustomEvent("hass-more-info", {
			detail: { entityId: e },
			bubbles: !0,
			composed: !0
		}));
	}
	static {
		this.styles = [Ye, o`
      :host {
        position: fixed;
        inset: 0;
        z-index: 7;
        display: flex;
        justify-content: center;
        align-items: flex-start;
        font-family: var(--ha-font-family-body, Roboto, sans-serif);
      }
      .backdrop {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.55);
      }
      .panel {
        position: relative;
        width: 100%;
        max-width: 560px;
        height: 100%;
        overflow-y: auto;
        background: #1f1f1f;
        color: #fff;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
      }
      @media (min-width: 600px) {
        :host {
          align-items: center;
        }
        .panel {
          height: auto;
          max-height: 90vh;
          border-radius: 20px;
        }
      }
      header {
        color: var(--lm-fg);
        border-radius: 0 0 20px 20px;
        padding: 14px 16px 12px;
        position: sticky;
        top: 0;
        z-index: 1;
        transition: color 0.8s;
      }
      header > .row,
      header > lm-slider,
      .light > .top,
      .light > .bottom {
        position: relative;
      }
      .row {
        display: flex;
        align-items: center;
        gap: 14px;
        margin-bottom: 8px;
      }
      .title {
        flex: 1;
        font-size: 1.3rem;
        font-weight: 600;
      }
      button {
        font: inherit;
        color: inherit;
        border: none;
        cursor: pointer;
      }
      .round {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .round ha-icon {
        --mdc-icon-size: 24px;
      }
      .body {
        padding: 8px 16px 24px;
      }
      h3 {
        font-size: 0.8rem;
        font-weight: 500;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: #a8a8a8;
        margin: 22px 4px 12px;
      }
      /* Scenes and lights: the same grid and tile size. */
      .tiles {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
        gap: 8px;
      }
      .scene {
        background: #3a3a3a;
        border-radius: 12px;
        padding: 10px 4px 8px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 6px;
        height: 120px;
        box-sizing: border-box;
        color: #fff;
      }
      .circle {
        width: 46px;
        height: 46px;
        border-radius: 50%;
        flex: none;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
      }
      .playing {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.35);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
      }
      .label {
        font-size: 0.85rem;
        line-height: 1.2;
        text-align: center;
        overflow-wrap: anywhere;
      }
      .light {
        height: 120px;
        border-radius: 12px;
        background: #3a3a3a;
        color: #fff;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        cursor: pointer;
        position: relative;
        transition: color 0.8s;
      }
      .top {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
        padding: 8px 4px 2px;
        text-align: center;
      }
      .lname {
        font-size: 0.85rem;
        line-height: 1.2;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        overflow-wrap: anywhere;
      }
      .bottom {
        background: rgba(0, 0, 0, 0.12);
        display: flex;
        justify-content: center;
        padding: 5px 0;
      }
      ha-state-icon {
        --mdc-icon-size: 24px;
      }
    `];
	}
};
function ot(e, t) {
	return t.filter((t) => {
		let n = e.states[t];
		return !!n && n.state !== "unavailable";
	});
}
function st(e, t) {
	let n = `${t} `;
	return e.toLowerCase().startsWith(n.toLowerCase()) ? e.slice(n.length) : e;
}
customElements.get("light-manager-room-dialog") || customElements.define("light-manager-room-dialog", at);
//#endregion
//#region src/light-manager-card.ts
var ct = class extends H {
	static {
		this.properties = {
			hass: { attribute: !1 },
			_config: { state: !0 },
			_room: { state: !0 },
			_error: { state: !0 }
		};
	}
	static getStubConfig() {
		return { area: "" };
	}
	setConfig(e) {
		if (!e.area) throw Error("Set 'area' to the area id of a room");
		this._config?.area !== e.area && (this._room = void 0), this._config = e;
	}
	getCardSize() {
		return 2;
	}
	getGridOptions() {
		return {
			columns: 12,
			rows: "auto",
			min_columns: 6
		};
	}
	updated() {
		this.hass && this._config && !this._room && !this._error && this._load();
	}
	async _load() {
		try {
			this._room = await Xe(this.hass, this._config.area);
		} catch (e) {
			this._error = e.message ?? String(e);
		}
	}
	render() {
		if (this._error) return M`<ha-card class="error">Light Manager: ${this._error}</ha-card>`;
		if (!this._room || !this.hass) return M`<ha-card class="loading"></ha-card>`;
		let e = this._room, t = nt(this.hass, e);
		return M`<ha-card style=${Ke(t)} @click=${this._open}>
      <lm-fade .background=${Ge(t)}></lm-fade>
      <div class="row">
        <span class="icon">${Z(this._config.icon ?? e.icon ?? "mdi:sofa")}</span>
        <span class="name">${this._config.name ?? e.name}</span>
        ${Je(t, (n) => rt(this.hass, e, t, n.detail.on))}
      </div>
      ${qe(t, (n) => it(this.hass, e, t, n.detail.value))}
    </ha-card>`;
	}
	willUpdate(e) {
		e.has("hass") && this._dialog && (this._dialog.hass = this.hass);
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this._dialog?.close();
	}
	_open() {
		if (!this._room || this._dialog) return;
		let e = document.createElement("light-manager-room-dialog");
		e.hass = this.hass, e.areaId = this._room.area_id, e.room = this._room, e.card = this, e.addEventListener("closed", () => this._dialog = void 0), this._dialog = e, document.body.appendChild(e);
	}
	static {
		this.styles = [Ye, o`
      ha-card {
        background: none;
        color: var(--lm-fg);
        border-radius: 16px;
        position: relative;
        overflow: hidden;
        padding: 12px 14px 4px;
        box-sizing: border-box;
        height: 100%;
        min-height: 80px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        gap: 4px;
        cursor: pointer;
        border: none;
        transition: color 0.8s;
      }
      .row,
      lm-slider {
        position: relative;
      }
      .row {
        display: flex;
        align-items: center;
        gap: 16px;
      }
      .name {
        flex: 1;
        font-size: 18px;
        font-weight: 500;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .icon {
        width: 32px;
        display: flex;
        justify-content: center;
      }
      .error {
        padding: 16px;
        color: var(--error-color, #db4437);
      }
      .loading {
        height: 84px;
        background: #3a3a3a;
      }
    `];
	}
};
customElements.get("light-manager-card") || customElements.define("light-manager-card", ct), window.customCards = window.customCards || [], window.customCards.push({
	type: "light-manager-card",
	name: "Light Manager room",
	description: "A room colored by its lights, with the Light Manager scene dimmer"
});
//#endregion
export { ct as LightManagerCard };
