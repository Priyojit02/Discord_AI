'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useServerStore } from '@/store';
import api from '@/lib/api';

export default function ServersPage() {
  const router = useRouter();
  const { servers, setServers, setActiveServer } = useServerStore();

  useEffect(() => {
    if (servers.length > 0) {
      const s = servers[0];
      setActiveServer(s);
      const firstChannel = s.channels?.find((c) => c.type === 'TEXT') || s.channels?.[0];
      if (firstChannel) {
        router.replace(`/servers/${s.id}/channels/${firstChannel.id}`);
      } else {
        router.replace('/dm');
      }
    } else {
      api.get('/servers')
        .then(({ data }) => {
          if (data && data.length > 0) {
            setServers(data);
            setActiveServer(data[0]);
            const first = data[0].channels?.find((c: any) => c.type === 'TEXT') || data[0].channels?.[0];
            if (first) {
              router.replace(`/servers/${data[0].id}/channels/${first.id}`);
            } else {
              router.replace('/dm');
            }
          } else {
            router.replace('/dm');
          }
        })
        .catch(() => {
          router.replace('/dm');
        });
    }
  }, [servers, setServers, setActiveServer, router]);

  return null;
}
