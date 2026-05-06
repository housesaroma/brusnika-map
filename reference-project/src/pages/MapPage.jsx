import React, { useState, useMemo, useCallback } from 'react';
import MapView from '@/components/map/MapView';
import PropertySidebar from '@/components/sidebar/PropertySidebar';
import PolygonSidebar from '@/components/sidebar/PolygonSidebar';
import PropertyDetailModal from '@/components/modals/PropertyDetailModal';
import ValuationModal from '@/components/modals/ValuationModal';
import FiltersModal from '@/components/modals/FiltersModal';
import FavoritesModal from '@/components/modals/FavoritesModal';
import LeftNavPanel from '@/components/toolbar/LeftNavPanel';
import SearchBar from '@/components/map/SearchBar';
import { DEMO_BUILDINGS, DEMO_FLATS } from '@/lib/demoData';
import { toast } from 'sonner';

const defaultFilters = {
  rooms_min: '',
  rooms_max: '',
  area_min: '',
  area_max: '',
  price_min: '',
  price_max: '',
  floor_min: '',
  floor_max: '',
  district: 'all',
  material: 'all',
  renovation: 'all',
};

export default function MapPage() {
  // State
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [selectedFlat, setSelectedFlat] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showValuation, setShowValuation] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [filters, setFilters] = useState(defaultFilters);
  const [isDrawing, setIsDrawing] = useState(false);
  const [polygonPoints, setPolygonPoints] = useState([]);
  const [activePolygon, setActivePolygon] = useState(null);
  const [showPolygonSidebar, setShowPolygonSidebar] = useState(false);
  const [drawingEnabledAt, setDrawingEnabledAt] = useState(0);
  const [heatMode, setHeatMode] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [searchTarget, setSearchTarget] = useState(null);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return Object.entries(filters).some(([key, val]) => {
      if (key === 'district' || key === 'material' || key === 'renovation') return val !== 'all';
      return val !== '';
    });
  }, [filters]);

  // Apply filters to flats
  const applyFiltersToFlats = useCallback(
    (flats) => {
      return flats.filter((f) => {
        if (filters.rooms_min && f.rooms < Number(filters.rooms_min)) return false;
        if (filters.rooms_max && f.rooms > Number(filters.rooms_max)) return false;
        if (filters.area_min && f.area < Number(filters.area_min)) return false;
        if (filters.area_max && f.area > Number(filters.area_max)) return false;
        if (filters.price_min && f.price < Number(filters.price_min)) return false;
        if (filters.price_max && f.price > Number(filters.price_max)) return false;
        if (filters.floor_min && f.floor < Number(filters.floor_min)) return false;
        if (filters.floor_max && f.floor > Number(filters.floor_max)) return false;
        if (filters.district !== 'all' && f.district !== filters.district) return false;
        if (filters.material !== 'all' && f.material !== filters.material) return false;
        if (filters.renovation !== 'all' && f.renovation !== filters.renovation) return false;
        return true;
      });
    },
    [filters]
  );

  // Get filtered flats for polygon or building
  const filteredFlats = useMemo(() => {
    let flats = DEMO_FLATS;
    if (activePolygon && activePolygon.length > 2) {
      flats = flats.filter((f) => isPointInPolygon([f.lat, f.lng], activePolygon));
    }
    return applyFiltersToFlats(flats);
  }, [activePolygon, applyFiltersToFlats]);

  // Buildings with updated flat counts
  const displayBuildings = useMemo(() => {
    return DEMO_BUILDINGS.map((b) => {
      const bFlats = filteredFlats.filter((f) => f.building_id === b.id);
      return { ...b, flat_count: bFlats.length };
    }).filter((b) => b.flat_count > 0);
  }, [filteredFlats]);

  // Flats for selected building
  const buildingFlats = useMemo(() => {
    if (!selectedBuilding) return [];
    return filteredFlats.filter((f) => f.building_id === selectedBuilding.id);
  }, [selectedBuilding, filteredFlats]);

  // Handlers
  const handleBuildingClick = (building) => {
    setSelectedBuilding(building);
    setSelectedFlat(null);
  };

  const handleFlatClick = (flat) => {
    setSelectedFlat(flat);
    setShowDetailModal(true);
  };

  const handlePolygonComplete = (points) => {
    setActivePolygon(points);
    setIsDrawing(false);
    setPolygonPoints([]);
    setShowPolygonSidebar(true);
    setSelectedBuilding(null);
  };

  const handleFinishPolygon = () => {
    if (polygonPoints.length >= 3) {
      handlePolygonComplete(polygonPoints);
    }
  };

  const handleToggleDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      setPolygonPoints([]);
    } else {
      setIsDrawing(true);
      setActivePolygon(null);
      setPolygonPoints([]);
      setShowPolygonSidebar(false);
      setDrawingEnabledAt(Date.now());
    }
  };

  const handleSavePolygonToFavorites = (name) => {
    const newFav = {
      id: `fav_${Date.now()}`,
      name,
      filters: {},
      geo_points: activePolygon || [],
    };
    setFavorites((prev) => [...prev, newFav]);
    toast.success('Полигон сохранён в избранное');
  };

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
  };

  const handleSaveFilters = (filtersToSave) => {
    const newFav = {
      id: `fav_${Date.now()}`,
      name: `Конфигурация ${favorites.length + 1}`,
      filters: filtersToSave,
      geo_points: activePolygon || [],
    };
    setFavorites((prev) => [...prev, newFav]);
    toast.success('Конфигурация сохранена');
  };

  const handleSelectFavorite = (fav) => {
    if (fav.filters) setFilters(fav.filters);
    if (fav.geo_points && fav.geo_points.length > 2) setActivePolygon(fav.geo_points);
  };

  const handleDeleteFavorite = (id) => {
    setFavorites((prev) => prev.filter((f) => f.id !== id));
    toast.success('Удалено');
  };

  const handleRenameFavorite = (id, newName) => {
    setFavorites((prev) => prev.map((f) => (f.id === id ? { ...f, name: newName } : f)));
  };

  return (
    <div className="h-screen w-screen relative overflow-hidden font-inter bg-background flex">
      {/* Left nav panel */}
      <LeftNavPanel
        onValuation={() => setShowValuation(true)}
        onFilters={() => setShowFilters(true)}
        onToggleHeatmap={setHeatMode}
        heatMode={heatMode}
        hasActiveFilters={hasActiveFilters}
        totalFlats={filteredFlats.length}
      />

      {/* Map area (offset by nav width) */}
      <div className="flex-1 relative" style={{ marginLeft: 220 }}>
        <SearchBar onSearch={setSearchTarget} />
        <MapView
          buildings={displayBuildings}
          selectedBuildingId={selectedBuilding?.id}
          onBuildingClick={handleBuildingClick}
          analogFlats={[]}
          isDrawing={isDrawing}
          polygonPoints={polygonPoints}
          setPolygonPoints={setPolygonPoints}
          onPolygonComplete={handlePolygonComplete}
          savedPolygon={activePolygon}
          onFavorites={() => setShowFavorites(true)}
          onToggleDrawing={handleToggleDrawing}
          searchTarget={searchTarget}
          drawingEnabledAt={drawingEnabledAt}
          heatMode={heatMode}
        />

        {/* Drawing hint */}
        {isDrawing && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 bg-card/95 backdrop-blur-md rounded-xl shadow-lg border border-primary/30 px-4 py-2.5">
            <span className="text-sm text-muted-foreground">
              Точек: <span className="font-semibold text-foreground">{polygonPoints.length}</span>
            </span>
            <div className="w-px h-4 bg-border" />
            <button
              onClick={handleFinishPolygon}
              disabled={polygonPoints.length < 3}
              className="text-sm font-medium text-primary disabled:text-muted-foreground disabled:cursor-not-allowed hover:text-primary/80 transition-colors"
            >
              Завершить полигон
            </button>
          </div>
        )}

        {/* Left sidebar (property list for building) */}
        <PropertySidebar
          building={selectedBuilding}
          flats={buildingFlats}
          selectedFlatId={selectedFlat?.id}
          onFlatClick={handleFlatClick}
          onClose={() => {
            setSelectedBuilding(null);
            setSelectedFlat(null);
          }}
          isOpen={!!selectedBuilding && !showPolygonSidebar}
        />

        {/* Left sidebar (polygon results) */}
        <PolygonSidebar
          isOpen={showPolygonSidebar}
          flats={filteredFlats}
          selectedFlatId={selectedFlat?.id}
          onFlatClick={handleFlatClick}
          onClose={() => {
            setShowPolygonSidebar(false);
            setActivePolygon(null);
          }}
          onSaveToFavorites={handleSavePolygonToFavorites}
        />
      </div>
      {/* end map area */}

      {/* Modals */}
      <PropertyDetailModal
        flat={selectedFlat}
        open={showDetailModal}
        onClose={() => setShowDetailModal(false)}
      />
      <ValuationModal open={showValuation} onClose={() => setShowValuation(false)} />
      <FiltersModal
        open={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={handleApplyFilters}
        onSave={handleSaveFilters}
        currentFilters={filters}
      />
      <FavoritesModal
        open={showFavorites}
        onClose={() => setShowFavorites(false)}
        favorites={favorites}
        onSelect={handleSelectFavorite}
        onDelete={handleDeleteFavorite}
        onRename={handleRenameFavorite}
      />
    </div>
  );
}

// Helper: point in polygon
function isPointInPolygon(point, polygon) {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}
