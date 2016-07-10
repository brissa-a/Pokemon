local new_value = tonumber(ARGV[1]);
local type = ARGV[2];
local stat = ARGV[3];


local count_key = 'type:' .. type .. ':stat:' .. stat .. ':count';
local avg_key = 'type:' .. type .. ':stat:' .. stat .. ':avg';

local count_exists = redis.call('exists', count_key)
local avg_exists = redis.call('exists', avg_key)

local count = 0
local avg = 0


if (count_exists ~= 0) then count = redis.call('get', count_key) end
if (avg_exists ~= 0) then avg = redis.call('get', avg_key) end

redis.call('set', 'debug1', count .. '-' .. avg .. '-' .. new_value .. '-' .. type .. '-' .. stat)

redis.call('set', avg_key, ((count * avg) + new_value) / (count + 1))
redis.call('set', count_key, count+1)

return avg;
