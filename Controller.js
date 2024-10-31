/**
 * Propiedad intelectual de Open Systems Colombia S.A.S (c)
 * 
 * Controlador principal de toda la aplicación ABGEO. En esta clase se realizan las consultas a base de datos.
 */
Ext.define('ABGEO.Controller.Controller', {
	extend: 'OB.Controller.BaseController',

	/**
	 * @property {Object} [obDefaultLayers = null]
	 * Las capas que se obtienen del servicio de GECGC.
	 */
	obDefaultLayers: null,

	/**
	 * @property {Boolean} [blAlreadyLoaded = false]
	 * Indica si las capas de GECGC fueron cargadas.
	 */
	blAlreadyLoaded: false,

	config: {
		routes: {
			'': {
				//Función que valida la seguridad de la aplicación. Valida si la aplicación es de ejecución directa
				//y si el usuario posee permisos para ejecutarla.
				before: 'ValidateAccess',
				action: 'onShowMain'
			}
		}
	},

	/**
	 * @method    onLaunch
	 * Se ejecuta cuando se inicializa el controller.
	 * Se encarga de ajustar el nombre y el título de la aplicación
	 *
	 * @private
	 */
	onLaunch: function () {
		Utilities.InitializeAPI(Open.api.gecgc);
		Utilities.InitializeAPI(Open.api.abgeo);
		Utilities.InitializeAPI(Open.api.orgeo);
	},

	/**
	 * @method    onShowMain
	 * Se ejecuta cuando el hash de la url es vacío.
	 * Se encarga de construir y visualizar la vista principal de la aplicación.
	 *
	 * @private
	 */
	onShowMain: function () {
		var me = this;
		me.LoadLayersSetting();
	},

	/**
	 * @method LoadLayersSetting
	 * Método que carga la configuración de las capas para ABGEO
	 */
	LoadLayersSetting: function () {
		var me = this,
			obRequest = null,
			obMask = {
				xtype: 'OUI_ExecutionIndicator',
				message: I18N.fsbWrite("Cargando", "GE_MESSAGE.DESCRIPTION@911527")
			};

		//Agrego máscara	
		Ext.Viewport.AddMask(obMask);
		// //Cacheo configuración
		// me.layerSettings = me.fobGetLayersSettingDefault();
		// me.changeView();
		// //Elimino máscara 
		// Ext.Viewport.RemoveMask(obMask);
		//Ejecuta servicio	
		obRequest = Open.api.abgeo.v1AbgeoSettingsPost({
			body: {
				sbApplication_name: me.fsbGetNameApp()
			}
		});

		//Obtengo datos de la solicitud del servicio
		obRequest.then(function (iobResponse) {
			//Valido si no hay configuración guardada 
			if (Ext.Object.isEmpty(iobResponse) || Ext.isEmpty(iobResponse)) {
				iobResponse = me.fobGetLayersSettingDefault();
			}

			if (iobResponse.nuZoom >= 10) {
				iobResponse.nuZoom = 13;
			}

			//Cacheo configuración
			me.layerSettings = iobResponse;

		})["catch"](function (iobError) {
			me.layerSettings = null;
			ErrorHandler.handleError(iobError, function () {
				//Se cierra aplicación
				me.CloseApp();
			});
		})["finally"](function () {
			//Valida si hay data para abrir la aplicación
			if (!Ext.isEmpty(me.layerSettings)) {
				//creo la vista de la aplicación
				me.changeView();
			}
			//Elimino máscara 
			Ext.Viewport.RemoveMask(obMask);
		});
	},

	/**
	 * @method fobLayersFromGECGC
	 * Retorna el servicio de carga de capas de GECGC
	 * 
	 * @return {Object} La promesa de servicio de GECGC
	 */
	fobLayersFromGECGC: function () {
		return Open.api.gecgc.v1GecgcLayersAbgeoGet();
	},

	/**
	 * @method fobGetLayersSettingDefault
	 * Método que retorna una configuración por defecto para las capas
	 * @return {Object} Objeto con la información de las capas
	 */
	fobGetLayersSettingDefault: function () {
		var me = this,
			obSetting = {
				"sbApplication_name": me.fsbGetNameApp(),
				"arMapCenter": [0, 0],
				"sbBaseLayerType": "OpenStreetMap",
				"nuBaseLayerMapType": 1,
				"nuZoom": 3,
				"arOSFLayers": [{
					"ORDER_": 0,
					"DISPLAY_VALUE": I18N.fsbWrite("Direcciones", "GE_MESSAGE.DESCRIPTION@913839"),
					"sbLayerName": "ADDRESS",
					"sbGeometryType": GISManager.csbPointV2,
					"sbType": "Smartflex",
					"blLayerVisible": false,
					"blPanelOpen": false,
					"blLabelActive": false,
					"nuHeightZoom": 17,
					"blMainLayer": true,
					"sbShape": GISManager.csbCircle,
					"obLayerStyle": {
						"radius": 5,
						"opacity": 1,
						"fillOpacity": 1,
						"color": '#E6695C',
						"fillColor": '#E6695C'
					}
				},
				{
					"ORDER_": 1,
					"DISPLAY_VALUE": I18N.fsbWrite("Zonas especiales", "GE_MESSAGE.DESCRIPTION@914804"),
					"sbType": "Smartflex",
					"sbGeometryType": GISManager.csbPolygon,
					"sbLayerName": "PRICING_ZONE",
					"blLayerVisible": false,
					"blPanelOpen": false,
					"blLabelActive": false,
					"nuHeightZoom": 15,
					"blMainLayer": true,
					"sbShape": '',
					"obLayerStyle": {
						"dashArray": null, //dash pattern
						"weight": 2, //stroke width
						"opacity": 1, //stroke opacity
						"fill": true,
						"fillOpacity": 0.4, //fill opacity
						"color": '#EB8F18', //stroke color
						"fillColor": '#EB8F18' //color relleno
					}
				},
				{
					"ORDER_": 2,
					"DISPLAY_VALUE": I18N.fsbWrite("Subcategorías", "GE_MESSAGE.DESCRIPTION@914863"),
					"sbType": "Smartflex",
					"sbGeometryType": GISManager.csbPolygon,
					"sbLayerName": "SUBCATEG",
					"blLayerVisible": false,
					"blPanelOpen": false,
					"blLabelActive": false,
					"nuHeightZoom": 15,
					"sbShape": '',
					"blMainLayer": true,
					"obLayerStyle": {
						"dashArray": null, //dash pattern
						"weight": 1, //stroke width
						"opacity": 1, //stroke opacity
						"fillOpacity": 0.4, //fill opacity
						"color": '#EB17DD', //stroke color
						"fillColor": '#EB17DD' //color relleno
					}
				},
				{
					"ORDER_": 4,
					"DISPLAY_VALUE": I18N.fsbWrite("Punto de interés", "GE_MESSAGE.DESCRIPTION@914514"),
					"sbType": "Smartflex",
					"sbGeometryType": GISManager.csbPointV2,
					"sbLayerName": "INTEREST_POINT",
					"blLayerVisible": false,
					"blPanelOpen": false,
					"blLabelActive": false,
					"nuHeightZoom": 16,
					"sbShape": '',
					"blMainLayer": true,
					"obLayerStyle": {
						"dashArray": null, //dash pattern
						"weight": 1, //stroke width
						"opacity": 1, //stroke opacity
						"fillOpacity": 0.4, //fill opacity
						"color": '#EB8F18', //stroke color
						"fillColor": '#EB8F18' //color relleno
					}
				}
				]
			};

		return obSetting;
	},

	/**
	 * @method changeView
	 * Método que crea y cambia la vista y  la hace visible en el viewport
	 */
	changeView: function () {
		var me = this,
			obMainView = Ext.create('ABGEO.View.GEOAddress', {
				obLayersSetting: me.layerSettings
			});

		obMainView.setTitle(me.fobGetMetaDataApp().sbDisplay);

		obMainView.on({
			evTapBackButton: 'onTapBackButton',
			evTapRightButton: 'onTapRightButton',
			evsavesetting: 'saveLayersSetting',
			evresetlayer: "ResetSettings",
			scope: me
		});

		me.ChangeView(obMainView, null, false);
	},

	/**
	 * @method ResetSettings
	 * Reinicia la configuración de una capa a la configuración por defecto
	 * 
	 * @param {Object} iobGISComponent El componente geografico.
	 * @param {Object} iobGCStyleComponent El subcomponente de estilos.
	 * @param {String} isbLayerName El nombre interno de la capa.
	 */
	ResetSettings: function (iobGISComponent, iobGCStyleComponent, isbLayerName) {
		var me = this;
		if (!me.blAlreadyLoaded) {
			me.fobLayersFromGECGC().then(function (iobResponse) {
				if (Ext.isEmpty(iobResponse)) {
					me.obDefaultLayers = me.fobGetLayersSettingDefault();
				} else {
					me.obDefaultLayers = iobResponse;
				}
			})["catch"](function () {
				console.error("Layers from GECGC isn't available");
				me.obDefaultLayers = me.fobGetLayersSettingDefault();
			})["finally"](function () {
				iobGISComponent.DownloadStyle(iobGCStyleComponent, isbLayerName, me.obDefaultLayers);
				me.blAlreadyLoaded = true;
			});
		} else {
			iobGISComponent.DownloadStyle(iobGCStyleComponent, isbLayerName, me.obDefaultLayers);
		}
	}

});