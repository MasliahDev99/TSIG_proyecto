import { useState, useEffect } from "react";
import axios from "axios";


export default function StopForm({ mode, initialData, onSubmit, onCancel, onDelete }) {
  const [formData, setFormData] = useState({
    name: "",
    route_info: "",
    department: "",
    direction: "",
    enabled: true,
    has_refuge: false,
    observations: "",
    lat: "",
    lng: "",
  });
  const [errors, setErrors] = useState({});

useEffect(() => {
  if (mode === "edit" && initialData) {
    setFormData({
      name: initialData.nombre || "",
      route_info: initialData.ruta || "",
      department: initialData.departamento || "",
      direction: initialData.sentido || "",
      enabled: initialData.estado ?? true,
      has_refuge: initialData.refugio ?? false,
      observations: initialData.observaciones || "",
      lat: initialData.lat ? String(initialData.lat) : "",
      lng: initialData.lng ? String(initialData.lng) : "",
    });
  } else if (mode === "add" && initialData) {
    setFormData((prev) => ({
      ...prev,
      name: "",
      route_info: "",
      department: "",
      direction: "",
      enabled: true,
      has_refuge: false,
      observations: "",
      lat: initialData.lat ? String(initialData.lat) : "",
      lng: initialData.lng ? String(initialData.lng) : "",
    }));
  }
}, [mode, initialData]);

  useEffect(() => {
    const handleUpdateCoordinates = (event) => {
      const { lat, lng } = event.detail;
      setFormData((prev) => ({ ...prev, lat, lng }));
    };
    window.addEventListener("update-stop-coordinates", handleUpdateCoordinates);
    return () => {
      window.removeEventListener("update-stop-coordinates", handleUpdateCoordinates);
    };
  }, []);

  useEffect(() => {
  const handleUpdateCoords = (e) => {
    const { lat, lng } = e.detail;
    setFormData((prev) => ({
      ...prev,
      lat,
      lng,
    }));
  };

  window.addEventListener("update-stop-coordinates", handleUpdateCoords);
  return () => window.removeEventListener("update-stop-coordinates", handleUpdateCoords);
}, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "El nombre es requerido.";
    if (!formData.lat || isNaN(Number.parseFloat(formData.lat))) newErrors.lat = "Latitud inválida.";
    if (!formData.lng || isNaN(Number.parseFloat(formData.lng))) newErrors.lng = "Longitud inválida.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    window.dispatchEvent(new Event("end-edit-stop-location")); // en ambos casos
    e.preventDefault();

    if (validate()) {
          let lat4326 = parseFloat(formData.lat);
    let lng4326 = parseFloat(formData.lng);

    // Por si estás guardando datos aún en EPSG:32721
    if (initialData?.epsg === "32721") {
      const transformed = toLonLat([lng4326, lat4326], "EPSG:32721");
      lng4326 = transformed[0];
      lat4326 = transformed[1];
    }
      const dataToSubmit = {
        nombre: formData.name,
        ruta: formData.route_info,
        departamento: formData.department,
        sentido: formData.direction,
        estado: formData.enabled,
        refugio: formData.has_refuge,
        observaciones: formData.observations,
        latitud: lat4326,
        longitud: lng4326,
      };

      try {
        let response;
        if (mode === "add") {
          response = await axios.post("http://localhost:8081/api/paradas/crear", dataToSubmit, {
            headers: { "Content-Type": "application/json" },
            withCredentials: true,
          });
        } else if (mode === "edit" && initialData?.id) {
          response = await axios.put(`http://localhost:8081/api/paradas/editar/${initialData.id}`, dataToSubmit, {
            headers: { "Content-Type": "application/json" },
            withCredentials: true,
          });
        }

        // ✅ Asegurarse de que haya respuesta antes de llamar onSubmit
        if (response && response.data && onSubmit) {
          onSubmit(response.data);
        }
      } catch (error) {
        console.error("Error al guardar la parada:", error);
      }
    }
  };

  const handleUpdateCoordsClick = () => {
    const event = new CustomEvent("start-edit-stop-location", {
      detail: {
        lat: formData.lat,
        lng: formData.lng,
        id: initialData?.id || null,
      },
    });
    window.dispatchEvent(event);
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
      <h3 className="text-lg font-semibold mb-3 text-center">
        {mode === "add" ? "Añadir Nueva Parada" : "Editar Parada"}
      </h3>

      <div>
        <label htmlFor="name" className="block text-sm font-medium">
          Nombre
        </label>
          <input
            type="text"
            name="name"
            id="name"
            value={formData.name}
            onChange={handleChange}
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm sm:text-sm ${
              errors.name ? "border-red-500" : "border-gray-300"
            } bg-white text-black`}
          />

        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="lat" className="block text-sm font-medium">
            Latitud
          </label>
            <input
              type="number"
              step="any"
              name="lat"
              id="lat"
              value={formData.lat}
              onChange={handleChange}
              readOnly
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm sm:text-sm ${
                errors.lat ? "border-red-500" : "border-gray-300"
              } bg-gray-100 text-black`}
            />

          {errors.lat && <p className="text-xs text-red-500 mt-1">{errors.lat}</p>}
        </div>
        <div>
          <label htmlFor="lng" className="block text-sm font-medium">
            Longitud
          </label>
            <input
              type="number"
              step="any"
              name="lng"
              id="lng"
              value={formData.lng}
              onChange={handleChange}
              readOnly
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm sm:text-sm ${
                errors.lng ? "border-red-500" : "border-gray-300"
              } bg-gray-100 text-black`}
            />

          {errors.lng && <p className="text-xs text-red-500 mt-1">{errors.lng}</p>}
        </div>
      </div>

      {mode === "edit" && (
        <button
          type="button"
          onClick={handleUpdateCoordsClick}
          className="text-sm text-blue-500 hover:underline"
        >
          Cambiar ubicación en el mapa
        </button>
      )}

      <div>
        <label htmlFor="route_info" className="block text-sm font-medium">
          Ruta / Km
        </label>
        <input
          type="text"
          name="route_info"
          id="route_info"
          value={formData.route_info}
          onChange={handleChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm bg-white text-black"
        />
      </div>

      <div>
        <label htmlFor="department" className="block text-sm font-medium">
          Departamento
        </label>
        <input
          type="text"
          name="department"
          id="department"
          value={formData.department}
          onChange={handleChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm bg-white text-black"
        />
      </div>

      <div>
        <label htmlFor="direction" className="block text-sm font-medium">
          Sentido
        </label>
        <input
          type="text"
          name="direction"
          id="direction"
          value={formData.direction}
          onChange={handleChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm bg-white text-black"
        />
      </div>

      <div className="flex items-center space-x-4 pt-2">
        <div className="flex items-center">
          <input
            type="checkbox"
            name="enabled"
            id="enabled"
            checked={formData.enabled}
            onChange={handleChange}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded"
          />
          <label htmlFor="enabled" className="ml-2 block text-sm">
            Habilitada
          </label>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            name="has_refuge"
            id="has_refuge"
            checked={formData.has_refuge}
            onChange={handleChange}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded"
          />
          <label htmlFor="has_refuge" className="ml-2 block text-sm">
            Tiene Refugio
          </label>
        </div>
      </div>

      <div>
        <label htmlFor="observations" className="block text-sm font-medium">
          Observaciones
        </label>
        <textarea
          name="observations"
          id="observations"
          value={formData.observations}
          onChange={handleChange}
          rows="2"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm bg-white text-black"
        ></textarea>
      </div>

      <div className="flex justify-end space-x-3 pt-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-500"
        >
          Cancelar
        </button>
        {mode === "edit" && initialData?.id && onDelete && (
          <button
            type="button"
            onClick={() => onDelete(initialData.id)}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 border border-transparent rounded-md shadow-sm"
          >
            Eliminar
          </button>
        )}
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 border border-transparent rounded-md shadow-sm"
        >
          {mode === "add" ? "Guardar Parada" : "Guardar Cambios"}
        </button>
      </div>
    </form>
  );
}
