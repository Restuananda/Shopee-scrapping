import { useScraperStore } from '../store/useScraperStore'

export default function DebugStore() {
  const store = useScraperStore()
  
  return (
    <div style={{ 
      position: 'fixed', 
      bottom: 10, 
      right: 10, 
      background: '#000', 
      color: '#0f0', 
      padding: '10px',
      fontSize: '10px',
      fontFamily: 'monospace',
      zIndex: 9999,
      maxWidth: '300px',
      maxHeight: '200px',
      overflow: 'auto'
    }}>
      <div>Products: {store.products?.length || 0}</div>
      <div>ItemsPerPage: {store.itemsPerPage}</div>
      <div>CurrentDataPage: {store.currentDataPage}</div>
      <div>TotalDataPages: {store.totalDataPages}</div>
      <div>Store keys: {Object.keys(store).join(', ')}</div>
    </div>
  )
}
