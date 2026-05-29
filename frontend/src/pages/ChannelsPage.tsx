import { Tv, Eye } from 'lucide-react';
import type { Channel } from '../types';

export function ChannelsPage({ channels }: { channels: Channel[] }) {
  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-3"><Tv size={14} className="text-accent" /><h3 className="text-xs font-semibold">Channels</h3></div>
      {channels.length === 0 ? <div className="text-center py-10 text-dark-300"><Tv size={32} className="mx-auto mb-2 opacity-40" /><p className="text-xs">No channels loaded yet</p></div> : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs"><thead><tr className="border-b-2 border-dark-600">
            {['Channel', 'Status', 'Game', 'Drops', 'Viewers', 'ACL', ''].map(h => <th key={h} className="text-left py-2 px-2.5 text-[10px] text-dark-200 uppercase tracking-wider font-bold">{h}</th>)}
          </tr></thead><tbody>
            {channels.map(ch => (
              <tr key={ch.id} className={`border-b border-dark-600 hover:bg-dark-600/50 ${ch.watching ? 'bg-accent/10' : ''}`}>
                <td className="py-2 px-2.5 font-semibold">{ch.name}</td>
                <td className="py-2 px-2.5"><span className={`badge ${ch.status === 'Online' ? 'badge-green' : ch.status === 'Pending' ? 'badge-yellow' : 'badge-red'}`}>{ch.status}</span></td>
                <td className="py-2 px-2.5 text-dark-200">{ch.game || '-'}</td>
                <td className="py-2 px-2.5">{ch.drops ? <span className="badge badge-green">Yes</span> : <span className="badge badge-red">No</span>}</td>
                <td className="py-2 px-2.5 text-dark-200">{ch.viewers || '-'}</td>
                <td className="py-2 px-2.5">{ch.acl ? <span className="badge badge-purple">ACL</span> : ''}</td>
                <td className="py-2 px-2.5">{ch.watching ? <Eye size={14} className="text-accent" /> : null}</td>
              </tr>
            ))}
          </tbody></table>
        </div>
      )}
    </div>
  );
}
